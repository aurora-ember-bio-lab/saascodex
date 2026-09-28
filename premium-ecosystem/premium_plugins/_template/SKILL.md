---
name: premium-plugin-template
description: |
  Template for a licensed (premium) SaaSCodex plugin. Copy this folder, rename
  it, and replace the copy. Use when authoring a paid plugin for the premium
  ecosystem.
---

# Premium Plugin Template

A premium plugin is a normal SaaSCodex skill with an extra `commercial.json`
sidecar. It activates only when the workspace is entitled (or a valid license
key is present).

## Checklist

1. Rename the folder to `<vendor>/<plugin>` under `premium-ecosystem/premium_plugins/`.
2. Write this `SKILL.md` — keep the same structure as any skill: what it
   produces, the workflow, and the quality bar.
3. Fill `saascodex.json` with the standard marketplace metadata.
4. Fill `commercial.json` with price, required plan, and license scope.
5. Register the plugin in `plugins/registry/premium/saascodex-marketplace.json`.
6. Map the plugin id in `commercial-core/entitlements.json`.

## Behavior when unentitled

Show the plugin as locked, explain which plan unlocks it, and link to
`https://saascodex.com/pricing`. Never partially activate.
