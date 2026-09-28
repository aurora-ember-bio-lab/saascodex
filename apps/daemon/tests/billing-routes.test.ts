// Integration test for the Stripe billing surface.
//
// Mounts the real billing routes on an express app (mirroring server.ts: the
// webhook gets `express.raw` before the JSON parser), points the Stripe client
// at a mock fetch, and drives the full subscription lifecycle over HTTP:
// plans -> checkout -> signed webhook -> subscription state -> cancellation.
//
// No real Stripe account is touched; only the HTTP boundary we own is exercised.

import { createHmac } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { registerBillingRoutes } from '../src/routes/billing.js';

const WEBHOOK_SECRET = 'whsec_test_secret';
const ENV = {
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_PRICE_PRO_EUR: 'price_pro_28',
  STRIPE_PRICE_STUDIOS_EUR: 'price_studios_48',
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  OD_PUBLIC_BASE_URL: 'https://app.saascodex.com',
} as NodeJS.ProcessEnv;

const stripeCalls: Array<{ url: string; body: string }> = [];

function mockStripeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const body = typeof init?.body === 'string' ? init.body : '';
  stripeCalls.push({ url, body });
  if (url.endsWith('/checkout/sessions')) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.test/cs_test_123',
          customer: 'cus_test_1',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
  }
  if (url.endsWith('/billing_portal/sessions')) {
    return Promise.resolve(
      new Response(JSON.stringify({ id: 'bps_1', url: 'https://billing.stripe.test/bps_1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  }
  return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
}

function signed(payload: string, secret = WEBHOOK_SECRET, nowSec = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac('sha256', secret).update(`${nowSec}.${payload}`).digest('hex');
  return `t=${nowSec},v1=${mac}`;
}

let dir: string;
let server: Server;
let base: string;
let nowMs = 1_760_000_000_000;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'saascodex-billing-routes-'));
  const app = express();
  // Mirror server.ts: the webhook claims the raw body before the JSON parser.
  app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  registerBillingRoutes(app, {
    paths: { RUNTIME_DATA_DIR: dir },
    env: ENV,
    now: () => nowMs,
    fetchImpl: mockStripeFetch as unknown as typeof fetch,
  });
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(dir, { recursive: true, force: true });
});

async function get(pathname: string) {
  const res = await fetch(`${base}${pathname}`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function postJson(pathname: string, body: unknown) {
  const res = await fetch(`${base}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function postWebhook(payload: unknown, header?: string) {
  const raw = JSON.stringify(payload);
  const res = await fetch(`${base}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': header ?? signed(raw) },
    body: raw,
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe('billing routes (HTTP)', () => {
  it('reports the plan catalog with resolved Stripe price IDs', async () => {
    const { status, body } = await get('/api/billing/plans');
    expect(status).toBe(200);
    expect(body.stripeConfigured).toBe(true);
    const plans = body.plans as Array<{ id: string; priceMonthlyEur: number | null; stripePriceId: string | null }>;
    const pro = plans.find((p) => p.id === 'pro')!;
    const studios = plans.find((p) => p.id === 'studios')!;
    expect(pro.priceMonthlyEur).toBe(28);
    expect(pro.stripePriceId).toBe('price_pro_28');
    expect(studios.priceMonthlyEur).toBe(48);
    expect(studios.stripePriceId).toBe('price_studios_48');
  });

  it('starts on the free plan', async () => {
    const { body } = await get('/api/billing/subscription');
    expect(body.plan).toBe('free');
    expect(body.status).toBe('trialing');
  });

  it('creates a Stripe Checkout session for Pro', async () => {
    stripeCalls.length = 0;
    const { status, body } = await postJson('/api/billing/checkout', { plan: 'pro', email: 'buyer@saascodex.com' });
    expect(status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.test/cs_test_123');
    expect(body.plan).toBe('pro');

    const call = stripeCalls.find((c) => c.url.endsWith('/checkout/sessions'))!;
    const params = new URLSearchParams(call.body);
    expect(params.get('mode')).toBe('subscription');
    expect(params.get('line_items[0][price]')).toBe('price_pro_28');
    expect(params.get('metadata[saascodex_plan]')).toBe('pro');
    expect(params.get('customer_email')).toBe('buyer@saascodex.com');
    expect(params.get('success_url')).toBe('https://app.saascodex.com/billing?checkout=success');
  });

  it('rejects an invalid plan and an unsigned/malformed webhook', async () => {
    expect((await postJson('/api/billing/checkout', { plan: 'enterprise' })).status).toBe(400);

    const bad = await postWebhook({ id: 'evt_x', type: 'checkout.session.completed' }, 't=1,v1=deadbeef');
    expect(bad.status).toBe(400);
    expect((bad.body.error as { code: string }).code).toBe('SIGNATURE_INVALID');
  });

  it('activates the subscription from a signed checkout.session.completed', async () => {
    const { status, body } = await postWebhook({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test_1',
          subscription: 'sub_test_1',
          metadata: { saascodex_plan: 'pro' },
          customer_details: { email: 'buyer@saascodex.com' },
        },
      },
    });
    expect(status).toBe(200);
    expect(body).toMatchObject({ received: true, applied: true });

    const sub = await get('/api/billing/subscription');
    expect(sub.body.plan).toBe('pro');
    expect(sub.body.status).toBe('active');
    expect(sub.body.stripeCustomerId).toBe('cus_test_1');
    expect((sub.body.gating as { watermarkExports: boolean }).watermarkExports).toBe(false);
  });

  it('maps customer.subscription.updated price/status onto the plan', async () => {
    await postWebhook({
      id: 'evt_upd',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_1',
          customer: 'cus_test_1',
          status: 'past_due',
          items: { data: [{ price: { id: 'price_studios_48' } }] },
        },
      },
    });
    const sub = await get('/api/billing/subscription');
    expect(sub.body.plan).toBe('studios');
    expect(sub.body.status).toBe('past_due');
  });

  it('returns the subscription to free when it is deleted', async () => {
    await postWebhook({
      id: 'evt_del',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_1',
          customer: 'cus_test_1',
          status: 'canceled',
          items: { data: [{ price: { id: 'price_studios_48' } }] },
        },
      },
    });
    const sub = await get('/api/billing/subscription');
    expect(sub.body.plan).toBe('free');
    expect(sub.body.status).toBe('canceled');
    // The seeded 7-day Pro trial is still open, so a cancelled subscriber keeps
    // clean exports until it lapses...
    expect((sub.body.gating as { watermarkExports: boolean }).watermarkExports).toBe(false);
    // ...and once the trial is over, the free plan watermarks again.
    nowMs = 1_760_000_000_000 + 8 * 24 * 60 * 60 * 1000;
    const lapsed = await get('/api/billing/subscription');
    expect((lapsed.body.gating as { watermarkExports: boolean }).watermarkExports).toBe(true);
  });

  it('opens the customer portal for the linked Stripe customer', async () => {
    stripeCalls.length = 0;
    const { status, body } = await postJson('/api/billing/portal', {});
    expect(status).toBe(200);
    expect(body.url).toBe('https://billing.stripe.test/bps_1');
    const call = stripeCalls.find((c) => c.url.endsWith('/billing_portal/sessions'))!;
    expect(new URLSearchParams(call.body).get('customer')).toBe('cus_test_1');
  });
});
