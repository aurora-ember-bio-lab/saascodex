# Plugin ecosystem architecture

SaaSCodex plugins are portable agent-skill folders: a `SKILL.md` plus an
optional `saascodex.json` sidecar. The ecosystem splits into **three trust
tiers** plus a **commercial core** that gates the paid tier.

```
plugins/
  _official/            first-party, bundled, preinstalled        (free)
  community/            community sources, install-on-demand      (free)
  registry/{official,community,premium}/saascodex-marketplace.json
premium-ecosystem/
  premium_plugins/      licensed plugin sources                   (paid)
commercial-core/        entitlement + license layer that gates premium
```

## Tiers

| Tier | Location | Trust | Preinstalled | Payment |
|---|---|---|---|---|
| Official | `plugins/_official/` | First-party, trusted | Yes (daemon scans at boot) | Free |
| Community | `plugins/community/` | Trust-on-install | No | Free |
| Premium | `premium-ecosystem/premium_plugins/` | Trust-on-install **+ entitlement** | No | Licensed |

The daemon already discovers registry sources by scanning `plugins/registry/*`,
so a `premium` catalog becomes a third source with no discovery change — only a
manifest and the entitlement gate.

## Resolution order

1. **Official** — bundled, always available.
2. **Premium** — available when the workspace's plan (or a license key) entitles
   it; otherwise visible-but-locked.
3. **Community** — available once installed and trusted.
4. **User** — user-authored skills under the runtime data dir.

## Premium plugin layout

```
premium-ecosystem/premium_plugins/<vendor>/<plugin>/
  SKILL.md          # the portable skill (same contract as every plugin)
  saascodex.json    # standard manifest (marketplace metadata)
  commercial.json   # first-party sidecar: price, plan, license scope
```

`commercial.json` keeps pricing/entitlement **out of the frozen plugin schema**
(the plugin sidecar stays standard); it is read by `commercial-core` and by the
premium registry entry.

## Commercial core

`commercial-core/` is the licensing/entitlement layer:

- `entitlements.json` — plan → premium access map (aligned with
  [`apps/daemon/src/billing/plans.ts`](../apps/daemon/src/billing/plans.ts)).
- [`LICENSING.md`](../commercial-core/LICENSING.md) — key issuance, offline
  verification, seat counting, revocation.

It ties into billing ([BILLING.md](./BILLING.md)) and auth
([AUTH.md](./AUTH.md)): a premium plugin activates only when the workspace plan
or a valid license entitles it.

## Adding a premium plugin

1. Copy `premium-ecosystem/premium_plugins/_template/`.
2. Fill `SKILL.md`, `saascodex.json`, `commercial.json`.
3. Add an entry to `plugins/registry/premium/saascodex-marketplace.json`
   (`name`, `source`, `version` are required; a `commercial` block is allowed).
4. Map the plugin id in `commercial-core/entitlements.json`.

## Related

- Plugin spec kit: [`plugins/spec/`](../plugins/spec/)
- Marketplace schema: `docs/schemas/saascodex.marketplace.v1.json`
- Product spec: [`plugins-spec.md`](./plugins-spec.md)
