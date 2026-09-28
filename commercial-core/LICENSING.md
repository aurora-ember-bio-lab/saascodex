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

```
SCX1.<base64url(payload)>.<base64url(signature)>
```

- `payload` — JSON `{ "licenseId", "workspace", "plugin", "plan", "seats",
  "issuedAt", "expiresAt" }`.
- `signature` — Ed25519 over the payload, issued by Aurora Ember Cyber Bio Lab's
  licensing key. The public key ships in the app; the private key never leaves
  the licensing service.

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
