# Commercial core

The entitlement and licensing layer for the **premium** plugin tier. It answers
one question for every premium plugin: *is this workspace allowed to run it?*

See the ecosystem overview in
[`docs/PLUGIN-ECOSYSTEM.md`](../docs/PLUGIN-ECOSYSTEM.md).

## Contents

| File | Purpose |
|---|---|
| [`entitlements.json`](./entitlements.json) | Workspace plan → premium plugin access map |
| [`entitlements.schema.json`](./entitlements.schema.json) | JSON schema for the map and the `commercial.json` sidecar |
| [`LICENSING.md`](./LICENSING.md) | License key format, offline verification, seats, revocation |

## Model

1. A premium plugin declares its requirement in its `commercial.json`
   (`requiresPlan`, `license`).
2. The plugin id is mapped in `entitlements.json`.
3. Activation checks the workspace plan (from
   [`apps/daemon/src/billing/plans.ts`](../apps/daemon/src/billing/plans.ts) and
   the hosted `subscriptions` table) **or** a valid license key.

Plans (source of truth: the plan catalog):

| Plan | Premium plugins |
|---|---|
| Free | No (trial unlocks Pro behavior during the 7-day window) |
| Pro | Yes |
| Studios | Yes, including shared brand libraries |

## Integrations

- **Billing** — [`docs/BILLING.md`](../docs/BILLING.md)
- **Auth (JWT/API keys)** — [`docs/AUTH.md`](../docs/AUTH.md)
- **Database (`subscriptions`, `api_keys`)** — [`docs/DATABASE.md`](../docs/DATABASE.md)
