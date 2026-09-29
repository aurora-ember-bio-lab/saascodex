# Licensing

How premium plugins are licensed. Complements the entitlement map in
[`entitlements.json`](./entitlements.json).

## What a license covers

- **Scope** — `workspace` (default), `seat`, or `perpetual`.
- **Plans** — a license binds to a workspace whose plan is one of
  `requiresPlan`; an active Stripe subscription satisfies it automatically.
- **Offline** — premium plugins may be verified without a network round-trip
  (useful for air-gapped or on-prem installs).

## Key format

Human-entered license **keys** use the ecosystem prefix format:

```
<PREFIX>-<TAG>-XXXXX-XXXXX-XXXXX-XXXX
```

- `PREFIX` — 4-char domain id (`SPLT`, `ASC2`, `NRLB`, …; see
  [`domains.json`](./domains.json)).
- `TAG` — 3-char tier id: `STR` starter, `PRO` pro, `STU` studio, `USG` usage.
- body — 19 [Crockford base32](https://www.crockford.com/base32.html) chars
  (alphabet excludes `I L O U`) = 18 random + 1 position-weighted checksum, so a
  mistyped key fails locally before any server call.

Generate test keys:

```bash
pnpm exec tsx commercial-core/scripts/gen-license-keys.ts          # table
pnpm exec tsx commercial-core/scripts/gen-license-keys.ts --json    # machine-readable
```

Keys are issued by the **licensing service**; the generator here only produces
`TEST`-format keys (not stored server-side). On activation the service returns
a short-lived **signed token** for offline use:

```
SCX1.<base64url(payload)>.<base64url(Ed25519 signature)>
```

with `payload = { licenseId, workspace, plugin, plan, seats, issuedAt, expiresAt }`.
Offline verification checks the Ed25519 signature against the bundled public key
plus `expiresAt` and the revocation list.

## License server

One shared server issues for every domain in the ecosystem
([`services/license-server/`](../services/license-server/README.md)).

| | |
|---|---|
| Deployed | `https://license-server-production-784b.up.railway.app` |
| Health / public key | `GET /health`, `GET /pubkey` |
| Mint (admin) | `POST /licenses` → `{ prefix, domain, tier, seats? }` |
| Activate | `POST /activate` → `{ key, workspace? }` → `SCX1` token |
| Revoke (admin) | `POST /revoke` → `{ licenseId }`; `GET /revocations` |

Admin auth: `Authorization: Bearer <LICENSE_ADMIN_TOKEN>` (Railway service
variable). Products verify tokens **offline** against the key from `/pubkey` —
see the README for the snippet.

> Mount a persistent Railway volume at `LICENSE_DATA_DIR` (or set
> `LICENSE_PRIVATE_KEY`) so the signing key survives redeploys; otherwise
> previously issued tokens stop verifying.

## Verification

1. Split the key; decode the payload; verify the Ed25519 signature against the
   bundled public key.
2. Check `plugin` matches the requested plugin and `expiresAt` is in the future.
3. Check `workspace` matches (or the plan from `subscriptions` is entitled).
4. Count seats: activation must not exceed `seats` concurrent workspaces.

Fail closed: an unverifiable or expired key leaves the plugin locked.

## Online activation

For subscription-backed access no key is needed — the hosted
`subscriptions` row (`status` `active`/`trialing`, plan in `requiresPlan`)
entitles the plugin. Key issuance is for on-prem/offline customers and is
minted from the same licensing service.

## Revocation

Maintain a revocation list keyed by `licenseId` (**and** `jti`-like ids) served
by the licensing endpoint; offline installs refresh it opportunistically and
honour the last-seen list. Revoked keys fail verification on the next check.

## Never

- Ship a private key, or a shared "master" license, inside a plugin folder.
- Store raw license keys in logs or in project files.
- Activate a premium plugin partially when unentitled — keep it visibly locked.
