# SaaSCodex marketing site

Static pages for **saascodex.com** — the plan page, registration, and landing.
Deploy this directory as its own Vercel project (static, no build step).

| Page | Path | Purpose |
|---|---|---|
| Landing | `index.html` | Product intro, CTAs |
| Pricing | `pricing.html` | Free / Pro €28 / Studios €48, monthly↔annual toggle, subscribe CTAs |
| Registration | `register.html` | Create an account, choose a plan |

## Plan model

Mirrors [`apps/daemon/src/billing/plans.ts`](../apps/daemon/src/billing/plans.ts):

| Plan | Price | Trial | Projects | Exports | API |
|---|---|---|---|---|---|
| Free | €0 | 7-day Pro trial | 3 | watermarked | no |
| Pro | €28/mo (€280/yr) | — | unlimited | clean | yes |
| Studios | €48/mo (€480/yr) | — | unlimited | clean | yes |

## Deploy

```bash
cd marketing
vercel deploy --prod      # or import the folder as a Vercel project
```

Set the site's domain to `saascodex.com`. The pages point the app/API at
`https://app.saascodex.com` (`API_BASE` / `APP_URL` in `register.html`); change
those constants if the app or daemon live elsewhere.

## Registration contract

`register.html` posts to `POST /api/auth/register` on the daemon:

```json
{ "email": "you@company.com", "password": "…", "name": "…", "plan": "pro" }
```

- `201` → the page redirects to the app (Pro/Studios continue to checkout).
- `501`/`404` → shown as "registration is not enabled on this deployment yet".
- `4xx/5xx` → the error message is surfaced inline.

The endpoint, JWT sessions, and API keys are specified in
[`docs/AUTH.md`](../docs/AUTH.md); plan gating in
[`docs/BILLING.md`](../docs/BILLING.md).

## Brand

Uses [`assets/brand/`](../assets/brand/) (glyph, favicon, palette). The favicon
here is a copy of `assets/brand/favicon.svg`.
