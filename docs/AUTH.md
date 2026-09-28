# Authentication and tokens

SaaSCodex has two auth surfaces: the **local daemon** (token/Basic, optimized
for a single machine) and the **hosted control plane** (JWT sessions + API keys,
backed by the Postgres schema in [DATABASE.md](./DATABASE.md)).

## Local daemon

Implemented in `apps/daemon/src/api-token-auth.ts` and wired in
`apps/daemon/src/server.ts` (the "API-token middleware"). It is **active only
when `OD_API_TOKEN` is set** and `SAASCODEX_DISABLE_API_AUTH` is not `1`.

Accepted credentials for `/api/*`:

| Caller | Credential |
|---|---|
| Desktop UI / local CLI (loopback) | no credential — loopback peers bypass the check |
| CLI / proxy over the network | `Authorization: Bearer <OD_API_TOKEN>` |
| Browser UI | HTTP Basic with the same token |

Exemptions:

- Health/readiness/version probes (`/health`, `/api/health`, `/ready`,
  `/api/ready`, `/version`, `/api/version`) stay open.
- Server-minted **project preview asset scopes** are accepted for `GET`s so
  sandboxed preview iframes can load HTML/CSS/JS.
- A short-lived **run-scoped export tool token** may pass only the exact
  screenshot-export endpoint; the route re-checks operation + project.

Comparison is timing-safe (`timingSafeEqual`). Generate the token with
`openssl rand -hex 32`.

> Behind a reverse proxy that already authenticates every request, set
> `SAASCODEX_DISABLE_API_AUTH=1`. Do **not** expose the daemon publicly with
> auth disabled.

## Hosted control plane

Accounts, login sessions, and programmatic keys live in Postgres:

| Table | Holds | Notes |
|---|---|---|
| `users` | account identity, `plan`, `stripe_customer_id` | email unique |
| `sessions` | `token_hash`, `expires_at`, `revoked_at` | one row per login/refresh |
| `api_keys` | `prefix` (display), `key_hash`, `last_used_at`, `revoked_at` | paid-tier programmatic access |

### Endpoints (implemented)

`apps/daemon/src/routes/auth.ts` (store: `apps/daemon/src/auth/store.ts`). Every
route answers `501 AUTH_NOT_CONFIGURED` until `JWT_SECRET` (≥ 16 chars) is set.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Create an account (`email`, `password`, `name?`, `plan?`) |
| `POST` | `/api/auth/login` | public | Exchange credentials for a session token |
| `GET` | `/api/auth/session` | Bearer session | Current user + plan |
| `POST` | `/api/auth/logout` | Bearer session | Revoke the current session |
| `GET` | `/api/auth/api-keys` | Bearer session | List keys (id, name, prefix, timestamps) |
| `POST` | `/api/auth/api-keys` | Bearer session + paid plan | Create a key (returned once) |
| `DELETE` | `/api/auth/api-keys/:id` | Bearer session | Revoke a key |

Registration creates the account on the **Free** plan (7-day Pro trial) and
issues a session. A requested Pro/Studios plan returns `next: "checkout"` so the
client continues to Stripe Checkout (`POST /api/billing/checkout`); the plan is
only upgraded once payment succeeds. Registration and login are the only public
auth routes; the rest require `Authorization: Bearer <session token>`.

Passwords are hashed with **scrypt** (`scrypt$N$r$p$salt$hash`, timing-safe
verify) and sessions are stored as `sha256` token hashes.

### JWT sessions

- Sign with **HS256** using `JWT_SECRET` (32+ random bytes,
  `openssl rand -hex 32`). Never commit it.
- Keep access tokens short-lived (e.g. 15 min); issue a refresh through the
  `sessions` row and revoke by setting `revoked_at`.
- Store only a **hash** of the token (`sessions.token_hash`), never the token
  itself, so a database read cannot mint a session.
- Put `sub` (user id), `iat`, `exp`, and `jti` (the `sessions.id`) in the
  claims; on each request, verify the signature, then verify the `jti` row is
  unexpired and unrevoked.
- Rotate `JWT_SECRET` by accepting the previous secret for one access-token
  lifetime during the rollover.

### API keys

- Format `scx_<env>_<random>`; store only `key_hash` (HMAC-SHA256 with
  `JWT_SECRET` or a dedicated pepper) and the non-secret `prefix` for display.
- Look keys up by hash; update `last_used_at` on use; revoke by setting
  `revoked_at`.
- Gate issuance on the paid plans (Pro / Studios carry `apiAccess` in
  `apps/daemon/src/billing/plans.ts`).

### Plan gating

The same plan model that drives billing ([BILLING.md](./BILLING.md)) gates the
hosted surfaces: `users.plan` + the `subscriptions` mirror decide project caps,
export watermarking, and API-key access. The free plan is capped at 3 projects
after its trial lapses.

## Security checklist

- [ ] `OD_API_TOKEN` is a 32-byte random hex value (not a passphrase)
- [ ] `JWT_SECRET` is a 32-byte random hex value, stored only in the platform's
      secret store
- [ ] Auth is only disabled behind a proxy that authenticates everything
- [ ] `SAASCODEX_ALLOWED_ORIGINS` lists exactly the web origins that should call
      `/api`
- [ ] Tokens and keys are hashed at rest; never logged in request traces
- [ ] `DATABASE_URL` uses TLS (`sslmode=require`) outside local compose
