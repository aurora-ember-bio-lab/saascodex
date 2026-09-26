# Billing and plans

SaaSCodex ships a local-first Free plan and two paid Stripe subscription
plans. This document is the contract for what each plan may do, how the
Stripe integration is wired, and how to configure it in each environment.

## Plans

| | Free | Pro | Studios |
|---|---|---|---|
| Price | €0 | **€28 / month** | **€48 / month** |
| Trial | 7-day Pro trial | — | — |
| Active projects | **3** | Unlimited | Unlimited |
| Export watermark | Yes (after and during trial) | No | No |
| API key access (`OD_API_TOKEN`) | No | Yes | Yes |
| Shared brand libraries | No | No | Yes |
| Roles and approvals | No | No | Yes |
| Support | Community | Email, 1 business day | Priority, 4 hours |

The catalog is defined in code at
[`apps/daemon/src/billing/plans.ts`](../apps/daemon/src/billing/plans.ts) -
prices, limits, trial length, and the Stripe price-ID env var for each paid
plan live there and are the single source of truth.

### Free plan rules

- **Local and free forever** - the daemon runs fully locally with no
  account required.
- **7-day Pro trial** starts on first launch (`trialEndsAt` is stamped into
  the billing state file). During the trial the workspace behaves like Pro.
- **3 active projects** after the trial - creating a fourth returns
  `project_limit`.
- **Watermark on exports** - free-plan exports carry the SaaSCodex
  watermark; Pro and Studios exports are clean.

### API key tier

Programmatic access uses the daemon bearer token (`OD_API_TOKEN`) described
in [architecture.md](./architecture.md#api-authentication). Paid plans
(Pro, Studios) may use it; the free plan is UI-only in hosted deployments.

## Stripe setup

1. In the [Stripe dashboard](https://dashboard.stripe.com), create two
   recurring prices in EUR:
   - Pro: €28 / month → copy the price ID (`price_...`)
   - Studios: €48 / month → copy the price ID (`price_...`)
2. Add a webhook endpoint pointing at
   `https://<your-host>/api/billing/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copy the webhook signing secret (`whsec_...`).
4. Configure the environment:

```bash
STRIPE_SECRET_KEY=sk_live_...            # or sk_test_... in dev
STRIPE_PRICE_PRO_EUR=price_...           # €28 / month
STRIPE_PRICE_STUDIOS_EUR=price_...       # €48 / month
STRIPE_WEBHOOK_SECRET=whsec_...
OD_PUBLIC_BASE_URL=https://app.example.com   # used for checkout redirects
```

Without `STRIPE_SECRET_KEY` the daemon still runs - `GET /api/billing/plans`
reports `stripeConfigured: false` and the checkout/portal endpoints answer
`501 STRIPE_NOT_CONFIGURED`.

## HTTP API

All endpoints sit under `/api` and follow the daemon's authentication model
(bearer token / Basic auth when `OD_API_TOKEN` is set; the webhook path is
exempt because it authenticates with the Stripe signature instead).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/billing/plans` | Public catalog with resolved price IDs |
| `GET` | `/api/billing/subscription` | Current plan, status, trial and gating |
| `POST` | `/api/billing/checkout` | Create a Stripe Checkout session (`{plan, email?}`) |
| `POST` | `/api/billing/portal` | Create a Customer Portal session |
| `POST` | `/api/billing/webhook` | Stripe webhook (signature-verified) |

### Webhook handling

The route is mounted behind `express.raw` (registered before the global
JSON parser in `server.ts`) because Stripe signs the exact payload bytes.
Requests are verified with `Stripe-Signature` using HMAC-SHA256 over
`${timestamp}.${payload}` with a 300 s replay window
(`apps/daemon/src/billing/stripe.ts`).

| Event | State change |
|---|---|
| `checkout.session.completed` | plan from session metadata, `active`, customer + subscription bound |
| `customer.subscription.updated` | plan from the subscription's price ID; `active` / `trialing` / `past_due` |
| `customer.subscription.deleted` | back to `free`, `canceled`, subscription cleared |
| `invoice.payment_failed` | status → `past_due` (plan kept during grace) |

Unknown event types are acknowledged with `applied: false` and ignored -
Stripe retries nothing.

## State

Billing state is a JSON file at `<runtime-data>/billing.json`, written
atomically (tmp file + rename):

```json
{
  "plan": "free",
  "status": "trialing",
  "stripeCustomerId": null,
  "stripeSubscriptionId": null,
  "stripePriceId": null,
  "trialEndsAt": 1760604800000,
  "currentPeriodEnd": null,
  "email": null,
  "updatedAt": 1760000000000,
  "createdAt": 1760000000000
}
```

Delete the file to reset a local installation back to a fresh 7-day trial.

## Tests

`apps/daemon/tests/billing.test.ts` covers the plan catalog and prices,
project-limit and watermark gating, webhook signature verification
(valid / tampered / wrong-secret / stale / malformed), state patches for
every handled event, and the store's trial seeding and expiry:

```bash
pnpm --filter @saascodex/daemon exec vitest run -c vitest.config.ts tests/billing.test.ts
```
