// Minimal Stripe REST client over fetch.
//
// SaaSCodex only needs three Stripe operations (Checkout Session, Customer
// Portal, webhook verification), so we speak the REST API directly with
// form encoding instead of pulling in the full SDK. Webhook signatures use
// Stripe's documented scheme: HMAC-SHA256 over `${timestamp}.${payload}`
// with a timing-safe compare and a replay window.

import { createHmac, timingSafeEqual } from 'node:crypto';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const DEFAULT_TOLERANCE_SEC = 300;

export class StripeError extends Error {
  readonly status: number;
  readonly type: string;
  constructor(message: string, status: number, type = 'stripe_error') {
    super(message);
    this.name = 'StripeError';
    this.status = status;
    this.type = type;
  }
}

export interface StripeClientOptions {
  secretKey: string;
  fetchImpl?: typeof fetch | undefined;
  apiBase?: string | undefined;
}

export interface CreateCheckoutSessionInput {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  customerId?: string | null;
  /** Plan being purchased; echoed into session metadata for the webhook. */
  plan: string;
  trialDays?: number;
  locale?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string | null;
}

export interface StripePortalSession {
  id: string;
  url: string;
}

export function createStripeClient(options: StripeClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBase = options.apiBase ?? STRIPE_API_BASE;

  async function request<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const body = new URLSearchParams(params).toString();
    const res = await fetchImpl(`${apiBase}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text.length > 0 ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const err = (json as { error?: { message?: string; type?: string } } | null)?.error;
      throw new StripeError(
        err?.message ?? `Stripe ${path} failed with status ${res.status}`,
        res.status,
        err?.type ?? 'api_error',
      );
    }
    return json as T;
  }

  return {
    async createCheckoutSession(
      input: CreateCheckoutSessionInput,
    ): Promise<StripeCheckoutSession> {
      const params: Record<string, string> = {
        mode: 'subscription',
        'line_items[0][price]': input.priceId,
        'line_items[0][quantity]': '1',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        'metadata[saascodex_plan]': input.plan,
        'subscription_data[metadata][saascodex_plan]': input.plan,
        allow_promotion_codes: 'false',
        billing_address_collection: 'auto',
      };
      if (input.trialDays && input.trialDays > 0) {
        params['subscription_data[trial_period_days]'] = String(input.trialDays);
      }
      if (input.customerId) {
        params.customer = input.customerId;
      } else if (input.customerEmail) {
        params.customer_email = input.customerEmail;
      }
      return request<StripeCheckoutSession>('/checkout/sessions', params);
    },

    async createPortalSession(input: {
      customerId: string;
      returnUrl: string;
    }): Promise<StripePortalSession> {
      return request<StripePortalSession>('/billing_portal/sessions', {
        customer: input.customerId,
        return_url: input.returnUrl,
      });
    },
  };
}

export type StripeClient = ReturnType<typeof createStripeClient>;

export interface StripeSignatureParts {
  timestamp: number;
  signatures: string[];
}

export function parseStripeSignatureHeader(header: string): StripeSignatureParts | null {
  const parts = new Map<string, string[]>();
  for (const kv of header.split(',')) {
    const idx = kv.indexOf('=');
    if (idx <= 0) continue;
    const key = kv.slice(0, idx).trim();
    const value = kv.slice(idx + 1).trim();
    const existing = parts.get(key);
    if (existing) existing.push(value);
    else parts.set(key, [value]);
  }
  const t = parts.get('t')?.[0];
  const v1 = parts.get('v1');
  if (!t || !v1 || v1.length === 0) return null;
  const timestamp = Number.parseInt(t, 10);
  if (!Number.isFinite(timestamp)) return null;
  return { timestamp, signatures: v1 };
}

export interface VerifyStripeSignatureOptions {
  /** Allowed clock skew in seconds (default 300, Stripe's own default). */
  toleranceSec?: number;
  nowSec?: number;
}

export type VerifyStripeSignatureResult =
  | { ok: true; timestamp: number }
  | { ok: false; reason: 'malformed_header' | 'timestamp_out_of_tolerance' | 'signature_mismatch' };

/**
 * Verify a `Stripe-Signature` header against the raw payload. `payload`
 * must be the exact bytes that were signed - pass a Buffer/string that has
 * not been JSON-parsed.
 */
export function verifyStripeSignature(
  payload: Buffer | string,
  header: string | undefined,
  secret: string,
  options: VerifyStripeSignatureOptions = {},
): VerifyStripeSignatureResult {
  const parsed = parseStripeSignatureHeader(header ?? '');
  if (!parsed) return { ok: false, reason: 'malformed_header' };

  const tolerance = options.toleranceSec ?? DEFAULT_TOLERANCE_SEC;
  const now = options.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' };
  }

  const body = typeof payload === 'string' ? payload : payload.toString('utf8');
  const expected = createHmac('sha256', secret)
    .update(`${parsed.timestamp}.${body}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  for (const candidate of parsed.signatures) {
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    ) {
      return { ok: true, timestamp: parsed.timestamp };
    }
  }
  return { ok: false, reason: 'signature_mismatch' };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export type ConstructStripeEventResult =
  | { ok: true; event: StripeWebhookEvent }
  | { ok: false; reason: 'malformed_header' | 'timestamp_out_of_tolerance' | 'signature_mismatch' };

/**
 * Verify and parse a webhook body in one step. Returns the parsed event
 * or a typed failure reason suitable for the HTTP status line.
 */
export function constructStripeEvent(
  payload: Buffer | string,
  header: string | undefined,
  secret: string,
  options: VerifyStripeSignatureOptions = {},
): ConstructStripeEventResult {
  const verified = verifyStripeSignature(payload, header, secret, options);
  if (!verified.ok) {
    return { ok: false, reason: verified.reason };
  }
  const body = typeof payload === 'string' ? payload : payload.toString('utf8');
  const event = JSON.parse(body) as StripeWebhookEvent;
  if (!event || typeof event.type !== 'string' || typeof event.id !== 'string') {
    throw new StripeError('Webhook payload is not a Stripe event', 400, 'invalid_payload');
  }
  return { ok: true, event };
}
