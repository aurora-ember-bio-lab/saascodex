---
name: studio-brand-library
description: |
  Studios-tier premium: shared brand libraries across the workspace — one
  source of truth for logos, palettes, and type that every project and teammate
  inherits. Requires an activation key.
triggers:
  - "studio brand library"
  - "shared brand library"
  - "team brand"
---

# Studio Brand Library

Give a Studios workspace one shared brand library that every project inherits,
instead of copying tokens per project.

## Requires

An activation license (Studios tier). Locked until
`POST /api/plugins/:id/activate-license` succeeds with a valid key.

## Workflow

1. Collect or extract the brand kit (logo, palette, type, voice).
2. Publish it to the workspace library as a versioned bundle.
3. Bind projects to the library so a token change propagates everywhere.
4. Provide a diff view for approvals before a library version ships.

## Output

A workspace brand-library bundle plus per-project bindings.
