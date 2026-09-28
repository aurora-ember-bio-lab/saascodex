# Pricing, subscriptions, and registration

The public plan surface lives in [`marketing/`](../marketing) and is the analog
of the upstream pricing page, rebuilt for **saascodex.com**.

## Pages

| Page | File | Purpose |
|---|---|---|
| Pricing | [`marketing/pricing.html`](../marketing/pricing.html) | Free / Pro €28 / Studios €48 with a monthly↔annual toggle |
| Registration | [`marketing/register.html`](../marketing/register.html) | Account creation with plan selection |
| Landing | [`marketing/index.html`](../marketing/index.html) | Product intro |

All plan references in the product (in-app upgrade gates, the go-plan campaign,
the enterprise link) now point at `https://saascodex.com` — see the domain
revision across the repo.

## Plans

| Plan | Price | Trial | Projects | Exports | API access |
|---|---|---|---|---|---|
| Free | €0 | 7-day Pro trial | 3 | watermarked | no |
| Pro | €28 / month (€280 / year) | — | unlimited | clean | yes |
| Studios | €48 / month (€480 / year) | — | unlimited | clean | yes |

Source of truth: [`apps/daemon/src/billing/plans.ts`](../apps/daemon/src/billing/plans.ts).

## Subscription flow

1. The visitor picks a plan on `pricing.html`.
2. `register.html` creates the account via `POST /api/auth/register`
   (`{ email, password, name, plan }`).
3. For Pro/Studios the app continues to **Stripe Checkout**
   (`POST /api/billing/checkout`); the same plan IDs are used.
4. Stripe webhooks (`checkout.session.completed`,
   `customer.subscription.*`, `invoice.payment_failed`) update plan state.
5. The **Customer Portal** (`POST /api/billing/portal`) handles cancellation and
   card changes.

Billing endpoints, gating, and the watermark/project-cap rules are documented in
[BILLING.md](./BILLING.md); the daemon implements them in
`apps/daemon/src/routes/billing.ts`.

## Registration and sessions

Registration is the first half of the auth flow; the JWT session model, API
keys, hashing, and rotation live in [AUTH.md](./AUTH.md).

- `POST /api/auth/register` → create account (`users`), issue a session
  (`sessions`).
- `POST /api/auth/login` → verify credentials, issue a session.
- `GET /api/auth/session` → current user + plan.

Registration is implemented by the daemon
(`apps/daemon/src/routes/auth.ts`); it requires `JWT_SECRET` and otherwise
answers `501`, which `register.html` surfaces as "registration is not enabled
on this deployment yet".

## Environment

| Variable | Where | Meaning |
|---|---|---|
| `OD_PUBLIC_BASE_URL` | daemon | Public origin used for checkout redirects |
| `JWT_SECRET` | daemon | Session signing secret |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_STUDIOS_EUR`, `STRIPE_WEBHOOK_SECRET` | daemon | Stripe plan IDs and webhook |
| `DATABASE_URL` | daemon | Accounts/subscriptions store |
