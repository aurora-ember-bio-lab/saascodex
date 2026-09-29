// SplatStudio plan catalog and plan gating.
//
// Plans are the single source of truth for what each tier may do. The
// Stripe price IDs are supplied through env vars so the same build works
// in local dev (no Stripe configured -> checkout endpoints answer 501)
// and in hosted deployments.

export type PlanId = 'free' | 'pro' | 'studios';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Monthly price in EUR; null for the free plan. */
  priceMonthlyEur: number | null;
  /** Length of the free plan's trial of Pro features, in days. */
  trialDays: number;
  /** Maximum concurrent projects; null means unlimited. */
  maxProjects: number | null;
  /** Exports carry the SplatStudio watermark while true. */
  watermarkExports: boolean;
  /** Programmatic API access (OD_API_TOKEN bearer) is allowed. */
  apiAccess: boolean;
  /** One-line positioning copy shown on the pricing surfaces. */
  blurb: string;
  features: string[];
  /** Env var that holds this plan's Stripe price ID (null for free). */
  stripePriceIdEnv: string | null;
}

export const BILLING_TRIAL_DAYS = 7;
export const FREE_PROJECT_LIMIT = 3;

export const BILLING_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyEur: null,
    trialDays: BILLING_TRIAL_DAYS,
    maxProjects: FREE_PROJECT_LIMIT,
    watermarkExports: true,
    apiAccess: false,
    blurb: 'Local-first workspace with a 7-day Pro trial.',
    features: [
      `${FREE_PROJECT_LIMIT} active projects`,
      `${BILLING_TRIAL_DAYS}-day Pro trial`,
      'Watermarked exports',
      'Community support',
    ],
    stripePriceIdEnv: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyEur: 28,
    trialDays: BILLING_TRIAL_DAYS,
    maxProjects: null,
    watermarkExports: false,
    apiAccess: true,
    blurb: 'For professionals shipping client work weekly.',
    features: [
      'Unlimited projects',
      'Watermark-free exports',
      'API key access',
      'Email support, 1 business day',
    ],
    stripePriceIdEnv: 'STRIPE_PRICE_PRO_EUR',
  },
  studios: {
    id: 'studios',
    name: 'Studios',
    priceMonthlyEur: 48,
    trialDays: BILLING_TRIAL_DAYS,
    maxProjects: null,
    watermarkExports: false,
    apiAccess: true,
    blurb: 'For teams running many brands together.',
    features: [
      'Everything in Pro',
      'Shared brand libraries',
      'Roles and approval flows',
      'Priority support, 4 hours',
    ],
    stripePriceIdEnv: 'STRIPE_PRICE_STUDIOS_EUR',
  },
};

export const PAID_PLAN_IDS: readonly PlanId[] = ['pro', 'studios'];

export function isPlanId(value: unknown): value is PlanId {
  return value === 'free' || value === 'pro' || value === 'studios';
}

export function resolvePlanPriceId(
  plan: PlanId,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const spec = BILLING_PLANS[plan];
  if (!spec.stripePriceIdEnv) return null;
  const priceId = env[spec.stripePriceIdEnv];
  return priceId && priceId.trim().length > 0 ? priceId.trim() : null;
}

/** Map a Stripe price ID back to a plan; null when the price is unknown. */
export function planFromStripePriceId(
  priceId: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): PlanId | null {
  if (!priceId) return null;
  for (const id of PAID_PLAN_IDS) {
    if (resolvePlanPriceId(id, env) === priceId) return id;
  }
  return null;
}

export interface PlanGating {
  maxProjects: number | null;
  watermarkExports: boolean;
  apiAccess: boolean;
}

/**
 * The free plan starts with a 7-day Pro trial; while the trial window is
 * open the effective gating is Pro's (unlimited projects, clean exports).
 * Once it lapses - or when a paid subscription lapses back to free - the
 * Free limits apply. Callers pass `trialEndsAt` from the billing state.
 */
export function effectivePlanOn(
  plan: PlanId,
  trialEndsAt: number | null,
  now: number,
): PlanId {
  if (plan === 'free' && trialEndsAt != null && now < trialEndsAt) return 'pro';
  return plan;
}

export function gatingForPlan(plan: PlanId): PlanGating {
  const spec = BILLING_PLANS[plan];
  return {
    maxProjects: spec.maxProjects,
    watermarkExports: spec.watermarkExports,
    apiAccess: spec.apiAccess,
  };
}

export type ProjectLimitCheck =
  | { ok: true }
  | { ok: false; reason: 'project_limit'; limit: number; plan: PlanId };

/**
 * Free plan projects are capped. The check is evaluated against the
 * number of already-active projects at creation time; deleting a
 * project frees a slot again.
 */
export function assertCanCreateProject(
  activeProjectCount: number,
  plan: PlanId,
): ProjectLimitCheck {
  const limit = BILLING_PLANS[plan].maxProjects;
  if (limit == null || activeProjectCount < limit) return { ok: true };
  return { ok: false, reason: 'project_limit', limit, plan };
}

export interface WatermarkDecisionInput {
  plan: PlanId;
  /** Epoch ms; null when no trial is running. */
  trialEndsAt: number | null;
  now: number;
}

/**
 * Watermark rule for exports. Pass the EFFECTIVE plan (run the billing
 * state through `effectivePlanOn` first): lapsed free plans watermark,
 * the 7-day trial and paid plans export cleanly.
 */
export function shouldWatermarkExports(input: WatermarkDecisionInput): boolean {
  const spec = BILLING_PLANS[input.plan];
  if (spec.watermarkExports) return true;
  // Paid plans export cleanly once the trial window they started with
  // has been converted; during the trial the watermark stays off as a
  // paid-plan preview. Free stays watermarked forever.
  return false;
}

export interface EffectiveAccess {
  plan: PlanId;
  gating: PlanGating;
  trialActive: boolean;
  trialEndsAt: number | null;
}

export function describePlanCatalog(
  env: NodeJS.ProcessEnv = process.env,
): Array<Omit<PlanDefinition, 'stripePriceIdEnv'> & { stripePriceId: string | null }> {
  return (Object.keys(BILLING_PLANS) as PlanId[]).map((id) => {
    const { stripePriceIdEnv, ...rest } = BILLING_PLANS[id];
    return { ...rest, stripePriceId: resolvePlanPriceId(id, env) };
  });
}
