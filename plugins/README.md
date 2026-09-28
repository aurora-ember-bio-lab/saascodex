# SaaSCodex Plugins

Language: English | [简体中文](README.zh-CN.md)

This directory has two different jobs:

- `_official/` - first-party plugins bundled with SaaSCodex. The daemon scans this tree at startup and registers these plugins as official.
- `community/` - community plugin source folders. These are installable plugins, but they are not preinstalled unless a registry entry points at them and the user installs one.
- `registry/` - default registry source manifests (`saascodex-marketplace.json`) for official and community catalogs. These feed the Plugins Available/Sources UI.
- `spec/` - the portable plugin specification, templates, examples, and agent handoff kit for building, testing, publishing, or opening a PR back to SaaSCodex.

A third **premium** tier lives outside this directory:
`registry/premium/saascodex-marketplace.json` (catalog seed),
[`../premium-ecosystem/premium_plugins/`](../premium-ecosystem/premium_plugins)
(licensed sources), and [`../commercial-core/`](../commercial-core)
(entitlement + licensing). See
[`../docs/PLUGIN-ECOSYSTEM.md`](../docs/PLUGIN-ECOSYSTEM.md).

The common contract is the same everywhere: a plugin is a portable agent skill folder with a `SKILL.md`, plus an optional versioned `saascodex.json` sidecar that gives SaaSCodex marketplace metadata, inputs, previews, pipelines, and trust/capability hints.

Start here:

- Plugin spec kit: [`spec/README.md`](spec/README.md)
- Plugin authoring spec: [`spec/SPEC.md`](spec/SPEC.md)
- Agent handoff guide: [`spec/AGENT-DEVELOPMENT.md`](spec/AGENT-DEVELOPMENT.md)
- Registry publishing strategy: [`spec/PUBLISHING-REGISTRIES.md`](spec/PUBLISHING-REGISTRIES.md)
- Full product spec: [`../docs/plugins-spec.md`](../docs/plugins-spec.md)
- Manifest schema: [`../docs/schemas/saascodex.plugin.v1.json`](../docs/schemas/saascodex.plugin.v1.json)
- Marketplace schema: [`../docs/schemas/saascodex.marketplace.v1.json`](../docs/schemas/saascodex.marketplace.v1.json)
