---
name: saascodex-pricing
description: |
  Dedicated pricing / plans page in a single HTML file - tier comparison,
  monthly-annual toggle, feature comparison table, FAQ, and enterprise
  band. Use when the brief asks for a "pricing page", "plans page",
  "compare plans", or "subscription tiers".
triggers:
  - "pricing page"
  - "pricing"
  - "plans page"
  - "compare plans"
  - "subscription tiers"
  - "tier comparison"
od:
  mode: prototype
  platform: responsive
  scenario: marketing
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [typography-hierarchy, accessibility-baseline, state-coverage, anti-ai-slop]
---

# Pricing Page Skill

Produce a single-file pricing page whose job is a confident plan choice.

## Workflow

1. **Read the active DESIGN.md** (injected above). Cards, badges, and the
   comparison table style come from its tokens only.
2. **Take the tiers from the brief** - names, prices, currency, billing
   period, and the 4-6 feature bullets each. If the brief is silent, use
   a three-tier shape (Free trial / Pro / Teams) with one recommended tier
   and realistic euro prices.
3. **Lay out the page:**
   - Slim hero: H1 + one sentence + monthly/annual toggle (annual shows a
     "2 months free" hint; state is CSS-only or plain markup).
   - Three plan cards: name, price with period, one-line positioning,
     feature bullets, CTA. The recommended tier is visually elevated
     (accent border + flag), never larger than its neighbors.
   - Per-plan CTA verb matches commitment: "Start free", "Upgrade",
     "Contact sales".
   - Feature comparison table: 8-12 rows grouped by category, checkmarks
     with visually-hidden "included"/"not included" text for screen
     readers, sticky header row.
   - Enterprise band: security/compliance bullets + "Talk to us" CTA.
   - FAQ: 4-5 real questions (trial length, cancellation, seats, invoicing).
4. **Hold the craft bar:**
   - Prices align on a shared baseline across cards; `<small>` period
     labels; tabular numerals if available.
   - Exactly one accent-colored action per viewport-worth of cards.
   - Table scrolls horizontally on narrow screens instead of squashing.
   - Focus rings on toggle, CTAs, and FAQ items; no color-only signals.
5. **Output one self-contained `index.html`** - embedded `<style>`, no
   external requests, no JavaScript unless the brief demands it.

## Anti-patterns

- Four tiers with three "most popular" flags.
- Prices in different sizes per card to make one look cheaper.
- Hidden footnotes that change the real price.
- Crossed-out anchor prices the product never charged.
