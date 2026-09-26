// SaaSCodex billing routes: plan catalog, subscription state, Stripe
// Checkout, Customer Portal, and webhook ingestion.
//
// The webhook endpoint is mounted behind `express.raw` (registered in
// server.ts before the global JSON parser) because Stripe signs the exact
// bytes of the payload; the JSON parser must not touch that body.

import express, { type Express, type Request, type Response } from 'express';

import {
  BILLING_PLANS,
  BILLING_TRIAL_DAYS,
  describePlanCatalog,
  effectivePlanOn,
  gatingForPlan,
  isPlanId,
  PAID_PLAN_IDS,
  planFromStripePriceId,
  resolvePlanPriceId,
  type PlanId,
} from '../billing/plans.js';
import {
  createBillingStore,
  isTrialActive,
  type BillingState,
  type BillingStatus,
} from '../billing/store.js';
import {
  constructStripeEvent,
  createStripeClient,
  StripeError,
  type ConstructStripeEventResult,
  type StripeWebhookEvent,
} from '../billing/stripe.js';

export interface RegisterBillingRoutesDeps {
  paths: { RUNTIME_DATA_DIR: string };
  env?: NodeJS.ProcessEnv;
  now?: () => number;
  fetchImpl?: typeof fetch;
}

function baseUrlFromRequest(req: Request, env: NodeJS.ProcessEnv): string {
  const configured = env.OD_PUBLIC_BASE_URL;
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/u, '');
  }
  const proto = req.protocol || 'http';
  const host = req.get('host');
  if (!host) return `http://localhost:${env.OD_PORT ?? '7456'}`;
  return `${proto}://${host}`;
}

function subscriptionPayload(state: BillingState, now: number) {
  const trialActive = isTrialActive(state, now);
  const effectivePlan = effectivePlanOn(state.plan, state.trialEndsAt, now);
  const gating = gatingForPlan(effectivePlan);
  return {
    plan: state.plan,
    effectivePlan,
    status: state.status,
    trialActive,
    trialEndsAt: state.trialEndsAt,
    currentPeriodEnd: state.currentPeriodEnd,
    stripeCustomerId: state.stripeCustomerId,
    stripeSubscriptionId: state.stripeSubscriptionId,
    email: state.email,
    gating: {
      maxProjects: gating.maxProjects,
      watermarkExports: gating.watermarkExports,
      apiAccess: gating.apiAccess,
    },
    updatedAt: state.updatedAt,
  };
}

/**
 * Apply a verified Stripe event to billing state. Pure with respect to
 * the store so it can be unit-tested; returns the patch to merge.
 */
export function stripeEventToPatch(
  event: StripeWebhookEvent,
  env: NodeJS.ProcessEnv,
  now: number,
): Partial<BillingState> | null {
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;

  if (event.type === 'checkout.session.completed') {
    const customer = typeof obj.customer === 'string' ? obj.customer : null;
    const subscription = typeof obj.subscription === 'string' ? obj.subscription : null;
    const metaPlan = (obj.metadata as Record<string, string> | undefined)?.saascodex_plan;
    const plan: PlanId | null = isPlanId(metaPlan) ? metaPlan : null;
    const details = obj.customer_details as { email?: unknown } | undefined;
    const email =
      typeof details?.email === 'string'
        ? details.email
        : typeof obj.customer_email === 'string'
          ? obj.customer_email
          : null;
    return {
      plan: plan ?? 'pro',
      status: 'active',
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      stripePriceId: null,
      email,
      currentPeriodEnd: null,
      updatedAt: now,
    };
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subId = typeof obj.id === 'string' ? obj.id : null;
    const customer = typeof obj.customer === 'string' ? obj.customer : null;
    const stripeStatus = typeof obj.status === 'string' ? obj.status : '';
    const items = obj.items as
      | { data?: Array<{ price?: { id?: unknown }; current_period_end?: unknown }> }
      | undefined;
    const item = Array.isArray(items?.data) ? items.data[0] : undefined;
    const priceId = typeof item?.price?.id === 'string' ? item.price.id : null;
    const periodEndRaw =
      typeof obj.current_period_end === 'number'
        ? obj.current_period_end
        : typeof item?.current_period_end === 'number'
          ? item.current_period_end
          : null;

    if (event.type === 'customer.subscription.deleted' || stripeStatus === 'canceled') {
      return {
        plan: 'free',
        status: 'canceled',
        stripeCustomerId: customer,
        stripeSubscriptionId: subId,
        stripePriceId: null,
        currentPeriodEnd: null,
        updatedAt: now,
      };
    }

    const mapped = planFromStripePriceId(priceId, env);
    const status: BillingStatus =
      stripeStatus === 'trialing'
        ? 'trialing'
        : stripeStatus === 'past_due'
          ? 'past_due'
          : stripeStatus === 'active'
            ? 'active'
            : stripeStatus === 'incomplete' || stripeStatus === 'incomplete_expired'
              ? 'past_due'
              : 'active';

    return {
      plan: mapped ?? 'pro',
      status,
      stripeCustomerId: customer,
      stripeSubscriptionId: subId,
      stripePriceId: priceId,
      currentPeriodEnd: periodEndRaw ? periodEndRaw * 1000 : null,
      updatedAt: now,
    };
  }

  if (event.type === 'invoice.payment_failed') {
    const subId =
      typeof obj.subscription === 'string' ? obj.subscription : null;
    if (!subId) return null;
    return { status: 'past_due', updatedAt: now };
  }

  // Unhandled event types are acknowledged but produce no state change.
  return null;
}

export function registerBillingRoutes(app: Express, deps: RegisterBillingRoutesDeps): void {
  const env = deps.env ?? process.env;
  const now = deps.now ?? Date.now;
  const store = createBillingStore(deps.paths.RUNTIME_DATA_DIR, now);

  app.get('/api/billing/plans', (_req: Request, res: Response) => {
    res.json({
      plans: describePlanCatalog(env),
      currency: 'EUR',
      trialDays: BILLING_TRIAL_DAYS,
      stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
    });
  });

  app.get('/api/billing/subscription', async (_req: Request, res: Response) => {
    const state = await store.read();
    res.json(subscriptionPayload(state, now()));
  });

  app.post('/api/billing/checkout', async (req: Request, res: Response) => {
    const requested = req.body?.plan;
    if (!isPlanId(requested) || !PAID_PLAN_IDS.includes(requested)) {
      return res.status(400).json({
        error: { code: 'INVALID_PLAN', message: 'plan must be "pro" or "studios"' },
      });
    }
    const secretKey = env.STRIPE_SECRET_KEY;
    const priceId = resolvePlanPriceId(requested, env);
    if (!secretKey || !priceId) {
      return res.status(501).json({
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message:
            'Set STRIPE_SECRET_KEY and the plan price ID env vars to enable checkout',
        },
      });
    }
    try {
      const state = await store.read();
      const base = baseUrlFromRequest(req, env);
      const email =
        typeof req.body?.email === 'string' && req.body.email.length > 0
          ? req.body.email
          : state.email;
      const client = createStripeClient({ secretKey, fetchImpl: deps.fetchImpl });
      const session = await client.createCheckoutSession({
        priceId,
        successUrl: `${base}/billing?checkout=success`,
        cancelUrl: `${base}/billing?checkout=cancelled`,
        customerEmail: email,
        customerId: state.stripeCustomerId,
        plan: requested,
      });
      if (session.customer && !state.stripeCustomerId) {
        await store.update({ stripeCustomerId: session.customer });
      }
      res.json({ url: session.url, sessionId: session.id, plan: requested });
    } catch (err) {
      if (err instanceof StripeError) {
        return res
          .status(err.status >= 500 ? 502 : 400)
          .json({ error: { code: 'STRIPE_ERROR', message: err.message } });
      }
      throw err;
    }
  });

  app.post('/api/billing/portal', async (req: Request, res: Response) => {
    const secretKey = env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(501).json({
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Set STRIPE_SECRET_KEY first' },
      });
    }
    const state = await store.read();
    if (!state.stripeCustomerId) {
      return res.status(409).json({
        error: {
          code: 'NO_CUSTOMER',
          message: 'No Stripe customer is linked to this installation yet',
        },
      });
    }
    try {
      const base = baseUrlFromRequest(req, env);
      const client = createStripeClient({ secretKey, fetchImpl: deps.fetchImpl });
      const session = await client.createPortalSession({
        customerId: state.stripeCustomerId,
        returnUrl: `${base}/billing`,
      });
      res.json({ url: session.url });
    } catch (err) {
      if (err instanceof StripeError) {
        return res
          .status(err.status >= 500 ? 502 : 400)
          .json({ error: { code: 'STRIPE_ERROR', message: err.message } });
      }
      throw err;
    }
  });

  app.post('/api/billing/webhook', async (req: Request, res: Response) => {
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(501).json({
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Set STRIPE_WEBHOOK_SECRET first' },
      });
    }
    const payload: unknown = req.body;
    if (!Buffer.isBuffer(payload)) {
      return res.status(400).json({
        error: {
          code: 'RAW_BODY_REQUIRED',
          message: 'Webhook body must arrive as raw bytes for signature verification',
        },
      });
    }
    let result: ConstructStripeEventResult;
    try {
      result = constructStripeEvent(payload, req.get('stripe-signature'), secret);
    } catch {
      return res.status(400).json({
        error: { code: 'INVALID_PAYLOAD', message: 'Payload is not a Stripe event' },
      });
    }
    if (!result.ok) {
      return res.status(400).json({
        error: { code: 'SIGNATURE_INVALID', message: result.reason },
      });
    }
    const patch = stripeEventToPatch(result.event, env, now());
    if (patch) await store.update(patch);
    res.json({ received: true, type: result.event.type, applied: Boolean(patch) });
  });
}
