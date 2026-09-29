import { createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  assertCanCreateProject,
  BILLING_PLANS,
  describePlanCatalog,
  effectivePlanOn,
  gatingForPlan,
  planFromStripePriceId,
  resolvePlanPriceId,
  shouldWatermarkExports,
} from '../src/billing/plans.js';
import {
  createBillingStore,
  defaultBillingState,
  isTrialActive,
} from '../src/billing/store.js';
import { verifyStripeSignature } from '../src/billing/stripe.js';
import { stripeEventToPatch } from '../src/routes/billing.js';

const ENV = {
  STRIPE_PRICE_PRO_EUR: 'price_pro_28',
  STRIPE_PRICE_STUDIOS_EUR: 'price_studios_48',
} as NodeJS.ProcessEnv;

describe('plan catalog', () => {
  it('pins the product prices and free-plan limits', () => {
    expect(BILLING_PLANS.free.priceMonthlyEur).toBeNull();
    expect(BILLING_PLANS.pro.priceMonthlyEur).toBe(28);
    expect(BILLING_PLANS.studios.priceMonthlyEur).toBe(48);
    expect(BILLING_PLANS.free.maxProjects).toBe(3);
    expect(BILLING_PLANS.pro.maxProjects).toBeNull();
    expect(BILLING_PLANS.studios.maxProjects).toBeNull();
    expect(BILLING_PLANS.free.trialDays).toBe(7);
    expect(BILLING_PLANS.free.watermarkExports).toBe(true);
    expect(BILLING_PLANS.pro.watermarkExports).toBe(false);
    expect(BILLING_PLANS.studios.watermarkExports).toBe(false);
    expect(BILLING_PLANS.free.apiAccess).toBe(false);
    expect(BILLING_PLANS.pro.apiAccess).toBe(true);
    expect(BILLING_PLANS.studios.apiAccess).toBe(true);
  });

  it('round-trips price ids to plans', () => {
    expect(resolvePlanPriceId('pro', ENV)).toBe('price_pro_28');
    expect(resolvePlanPriceId('studios', ENV)).toBe('price_studios_48');
    expect(resolvePlanPriceId('free', ENV)).toBeNull();
    expect(planFromStripePriceId('price_pro_28', ENV)).toBe('pro');
    expect(planFromStripePriceId('price_studios_48', ENV)).toBe('studios');
    expect(planFromStripePriceId('price_unknown', ENV)).toBeNull();
    expect(planFromStripePriceId(null, ENV)).toBeNull();
  });

  it('exposes the catalog with resolved price ids for the client', () => {
    const catalog = describePlanCatalog(ENV);
    expect(catalog.map((p) => p.id)).toEqual(['free', 'pro', 'studios']);
    const pro = catalog.find((p) => p.id === 'pro');
    expect(pro?.stripePriceId).toBe('price_pro_28');
    expect(pro).not.toHaveProperty('stripePriceIdEnv');
  });
});

describe('plan gating', () => {
  it('caps the free plan at three projects and never caps paid plans', () => {
    expect(assertCanCreateProject(0, 'free').ok).toBe(true);
    expect(assertCanCreateProject(2, 'free').ok).toBe(true);
    const blocked = assertCanCreateProject(3, 'free');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe('project_limit');
      expect(blocked.limit).toBe(3);
    }
    expect(assertCanCreateProject(99, 'pro').ok).toBe(true);
    expect(assertCanCreateProject(99, 'studios').ok).toBe(true);
  });

  it('gates a lapsed free plan but not a trial or a paid plan', () => {
    const now = Date.now();
    const trialEndsAt = now + 1000;
    const expired = now - 1;
    // Inside the 7-day trial the effective plan is Pro: no cap.
    expect(effectivePlanOn('free', trialEndsAt, now)).toBe('pro');
    expect(assertCanCreateProject(99, effectivePlanOn('free', trialEndsAt, now)).ok).toBe(true);
    // After the trial the free limits apply: 3 projects.
    const lapsed = effectivePlanOn('free', expired, now);
    expect(lapsed).toBe('free');
    const blocked = assertCanCreateProject(3, lapsed);
    expect(blocked.ok).toBe(false);
    // Paid plans are never capped.
    expect(effectivePlanOn('pro', trialEndsAt, now)).toBe('pro');
    expect(effectivePlanOn('studios', expired, now)).toBe('studios');
    expect(assertCanCreateProject(99, 'pro').ok).toBe(true);
    expect(assertCanCreateProject(99, 'studios').ok).toBe(true);
  });

  it('watermarks lapsed-free exports and keeps trial/paid exports clean', () => {
    const now = Date.now();
    // Trial active -> effective plan is Pro -> no watermark.
    expect(
      shouldWatermarkExports({ plan: effectivePlanOn('free', now + 1000, now), trialEndsAt: null, now }),
    ).toBe(false);
    // Trial lapsed -> free -> watermark.
    expect(
      shouldWatermarkExports({ plan: effectivePlanOn('free', now - 1, now), trialEndsAt: null, now }),
    ).toBe(true);
    expect(shouldWatermarkExports({ plan: 'pro', trialEndsAt: null, now })).toBe(false);
    expect(shouldWatermarkExports({ plan: 'studios', trialEndsAt: null, now })).toBe(false);
    expect(gatingForPlan('free').watermarkExports).toBe(true);
  });
});

describe('stripe webhook signature verification', () => {
  const secret = 'whsec_test_secret';
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });

  function sign(body: string, timestamp: number, key = secret): string {
    const mac = createHmac('sha256', key).update(`${timestamp}.${body}`).digest('hex');
    return `t=${timestamp},v1=${mac}`;
  }

  it('accepts a correctly signed payload', () => {
    const now = 1_760_000_000;
    const result = verifyStripeSignature(payload, sign(payload, now), secret, { nowSec: now });
    expect(result).toEqual({ ok: true, timestamp: now });
  });

  it('rejects a tampered payload', () => {
    const now = 1_760_000_000;
    const header = sign(payload, now);
    const result = verifyStripeSignature(`${payload} `, header, secret, { nowSec: now });
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' });
  });

  it('rejects a wrong secret', () => {
    const now = 1_760_000_000;
    const header = sign(payload, now, 'whsec_other');
    const result = verifyStripeSignature(payload, header, secret, { nowSec: now });
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' });
  });

  it('rejects stale timestamps outside the tolerance window', () => {
    const now = 1_760_000_000;
    const header = sign(payload, now);
    const result = verifyStripeSignature(payload, header, secret, {
      nowSec: now + 301,
      toleranceSec: 300,
    });
    expect(result).toEqual({ ok: false, reason: 'timestamp_out_of_tolerance' });
  });

  it('rejects a missing or malformed header', () => {
    expect(verifyStripeSignature(payload, undefined, secret)).toEqual({
      ok: false,
      reason: 'malformed_header',
    });
    expect(verifyStripeSignature(payload, 'garbage', secret)).toEqual({
      ok: false,
      reason: 'malformed_header',
    });
  });
});

describe('stripeEventToPatch', () => {
  const now = 1_760_000_000_000;

  function event(type: string, object: Record<string, unknown>) {
    return { id: `evt_${type}`, type, data: { object } };
  }

  it('activates a paid plan from checkout.session.completed metadata', () => {
    const patch = stripeEventToPatch(
      event('checkout.session.completed', {
        customer: 'cus_1',
        subscription: 'sub_1',
        metadata: { splatstudio_plan: 'studios' },
        customer_details: { email: 'owner@studio.test' },
      }),
      ENV,
      now,
    );
    expect(patch).toMatchObject({
      plan: 'studios',
      status: 'active',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      email: 'owner@studio.test',
    });
  });

  it('maps subscription.updated price + status onto the plan state', () => {
    const patch = stripeEventToPatch(
      event('customer.subscription.updated', {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        current_period_end: 1_762_500_000,
        items: { data: [{ price: { id: 'price_pro_28' } }] },
      }),
      ENV,
      now,
    );
    expect(patch).toMatchObject({
      plan: 'pro',
      status: 'active',
      stripePriceId: 'price_pro_28',
      currentPeriodEnd: 1_762_500_000 * 1000,
    });
  });

  it('records past_due on payment failure without dropping the plan', () => {
    const patch = stripeEventToPatch(
      event('customer.subscription.updated', {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'past_due',
        items: { data: [{ price: { id: 'price_pro_28' } }] },
      }),
      ENV,
      now,
    );
    expect(patch).toMatchObject({ plan: 'pro', status: 'past_due' });
  });

  it('falls back to free when the subscription is deleted', () => {
    const patch = stripeEventToPatch(
      event('customer.subscription.deleted', {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'canceled',
        items: { data: [{ price: { id: 'price_pro_28' } }] },
      }),
      ENV,
      now,
    );
    expect(patch).toMatchObject({ plan: 'free', status: 'canceled' });
    expect(patch?.stripeSubscriptionId).toBe('sub_1');
  });

  it('flags past_due on invoice.payment_failed', () => {
    const patch = stripeEventToPatch(
      event('invoice.payment_failed', { subscription: 'sub_1' }),
      ENV,
      now,
    );
    expect(patch).toMatchObject({ status: 'past_due' });
  });

  it('ignores unrelated event types', () => {
    expect(stripeEventToPatch(event('customer.created', { id: 'cus_1' }), ENV, now)).toBeNull();
  });
});

describe('billing store', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'splatstudio-billing-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('seeds a 7-day free trial on first read and persists updates', async () => {
    const now = () => 1_760_000_000_000;
    const store = createBillingStore(dir, now);
    const fresh = await store.read();
    expect(fresh.plan).toBe('free');
    expect(fresh.status).toBe('trialing');
    expect(fresh.trialEndsAt).toBe(1_760_000_000_000 + 7 * 24 * 60 * 60 * 1000);
    expect(isTrialActive(fresh, now())).toBe(true);

    await store.update({ plan: 'pro', status: 'active', stripeCustomerId: 'cus_1' });
    const updated = await store.read();
    expect(updated.plan).toBe('pro');
    expect(updated.stripeCustomerId).toBe('cus_1');
    expect(updated.updatedAt).toBe(now());
  });

  it('expires the trial once the window passes', () => {
    const state = defaultBillingState(1_000);
    expect(isTrialActive(state, 1_000 + 1000)).toBe(true);
    expect(isTrialActive(state, state.trialEndsAt!)).toBe(false);
    expect(isTrialActive(state, state.trialEndsAt! + 1)).toBe(false);
  });
});
