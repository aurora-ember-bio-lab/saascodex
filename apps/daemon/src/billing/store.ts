// Persistent billing state for the local daemon.
//
// The state file lives next to the rest of the runtime data
// (`<RUNTIME_DATA_DIR>/billing.json`). It records which plan the
// installation is on, the Stripe customer/subscription binding, and the
// trial window. Writes are atomic (tmp file + rename) so a crash cannot
// leave a half-written state behind.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  BILLING_TRIAL_DAYS,
  isPlanId,
  type PlanId,
} from './plans.js';

export type BillingStatus =
  | 'trialing' // free plan inside the 7-day window
  | 'active' // paid subscription in good standing
  | 'past_due' // payment failed, grace period
  | 'canceled' // subscription ended; back on free
  | 'none'; // never initialized

export interface BillingState {
  plan: PlanId;
  status: BillingStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  /** Epoch ms when the free trial ends. */
  trialEndsAt: number | null;
  /** Epoch ms of the current paid period end. */
  currentPeriodEnd: number | null;
  /** Email the checkout started with, if known. */
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

export const BILLING_STATE_FILENAME = 'billing.json';

export function defaultBillingState(now: number): BillingState {
  return {
    plan: 'free',
    status: 'trialing',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    trialEndsAt: now + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000,
    currentPeriodEnd: null,
    email: null,
    updatedAt: now,
    createdAt: now,
  };
}

function coerce(raw: unknown, now: number): BillingState {
  const base = defaultBillingState(now);
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<BillingState>;
  return {
    plan: isPlanId(obj.plan) ? obj.plan : base.plan,
    status:
      obj.status === 'trialing' ||
      obj.status === 'active' ||
      obj.status === 'past_due' ||
      obj.status === 'canceled' ||
      obj.status === 'none'
        ? obj.status
        : base.status,
    stripeCustomerId: typeof obj.stripeCustomerId === 'string' ? obj.stripeCustomerId : null,
    stripeSubscriptionId:
      typeof obj.stripeSubscriptionId === 'string' ? obj.stripeSubscriptionId : null,
    stripePriceId: typeof obj.stripePriceId === 'string' ? obj.stripePriceId : null,
    trialEndsAt: typeof obj.trialEndsAt === 'number' ? obj.trialEndsAt : null,
    currentPeriodEnd: typeof obj.currentPeriodEnd === 'number' ? obj.currentPeriodEnd : null,
    email: typeof obj.email === 'string' ? obj.email : null,
    updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : now,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : now,
  };
}

export interface BillingStore {
  readonly filePath: string;
  read(): Promise<BillingState>;
  write(state: BillingState): Promise<void>;
  update(patch: Partial<BillingState>): Promise<BillingState>;
}

export function createBillingStore(runtimeDataDir: string, now: () => number = Date.now): BillingStore {
  const filePath = path.join(runtimeDataDir, BILLING_STATE_FILENAME);

  async function read(): Promise<BillingState> {
    let text: string;
    try {
      text = await readFile(filePath, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        const fresh = defaultBillingState(now());
        await write(fresh);
        return fresh;
      }
      throw err;
    }
    try {
      return coerce(JSON.parse(text), now());
    } catch {
      // Corrupt state: fall back to defaults rather than bricking billing.
      const fresh = defaultBillingState(now());
      await write(fresh);
      return fresh;
    }
  }

  async function write(state: BillingState): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await rename(tmp, filePath);
  }

  async function update(patch: Partial<BillingState>): Promise<BillingState> {
    const current = await read();
    const next: BillingState = { ...current, ...patch, updatedAt: now() };
    await write(next);
    return next;
  }

  return { filePath, read, write, update };
}

/**
 * Effective state after applying time: a trialing free plan whose trial
 * window has elapsed is reported as expired (still plan 'free', but the
 * caller should surface "trial ended").
 */
export function isTrialActive(state: BillingState, now: number): boolean {
  if (state.plan !== 'free' && state.status !== 'trialing') return false;
  if (state.trialEndsAt == null) return false;
  return now < state.trialEndsAt;
}
