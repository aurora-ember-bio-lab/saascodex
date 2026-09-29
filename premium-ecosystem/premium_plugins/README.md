# Premium plugins

Licensed SplatStudio plugins. These are distribution sources, not bundled
content: the daemon discovers them through
[`plugins/registry/premium/splatstudio-marketplace.json`](../../plugins/registry/premium/splatstudio-marketplace.json)
and activates one only when the workspace is entitled (see
[`commercial-core/`](../../commercial-core/) and
[`docs/PLUGIN-ECOSYSTEM.md`](../../docs/PLUGIN-ECOSYSTEM.md)).

## Layout

```
premium_plugins/<vendor>/<plugin>/
  SKILL.md          # portable skill contract (same as all plugins)
  splatstudio.json    # standard marketplace manifest
  commercial.json   # price / plan / license scope (first-party sidecar)
```

## Start from the template

```bash
cp -r premium_ecosystem/premium_plugins/_template premium-ecosystem/premium_plugins/acme/my-plugin
```

Then fill in the three files, register the plugin in the premium marketplace
manifest, and map it in `commercial-core/entitlements.json`.

## Rules

- Keep the plugin folder standard (`SKILL.md` + `splatstudio.json`); pricing and
  entitlement live in `commercial.json`, never in the frozen plugin schema.
- Never ship secrets or license keys inside a plugin folder.
- The plugin must degrade gracefully when unentitled: visible-but-locked, no
  partial activation.
