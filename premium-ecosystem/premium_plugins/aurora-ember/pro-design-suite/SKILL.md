---
name: pro-design-suite
description: |
  Premium design suite for Pro subscribers: generates a full production design
  system — color, type, spacing, elevation, and component tokens — plus a
  matching component gallery, from a brand brief. Requires an activation key.
triggers:
  - "pro design suite"
  - "premium design system"
  - "generate design tokens"
---

# Pro Design Suite

Generate a complete, production-grade design system from a short brand brief:
token contract, component library, and a live gallery.

## Requires

An activation license. Locked plugins show "Activate license" and unlock once a
valid `SCX1` activation key is applied (`POST /api/plugins/:id/activate-license`).

## Workflow

1. Read the brand brief (name, industry, mood, one reference).
2. Emit `tokens.css` with the full A1/A2/B-slot token contract.
3. Emit `components.html` whose first `:root` block is byte-equivalent to
   `tokens.css` (so agents always have both the values and a working example).
4. Emit `DESIGN.md` documenting color, type, spacing, motion, and a11y rules.
5. Hold the craft bar: one accent hue, AA contrast, no invented token names.

## Output

`DESIGN.md`, `tokens.css`, `components.html`, and a `README.md` explaining how to
bind the system in a project.
