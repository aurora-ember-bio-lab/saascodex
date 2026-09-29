---
name: splatstudio-landing
description: |
  SaaS marketing landing page in a single HTML file - sticky nav, hero with
  product screenshot placeholder, logo strip, feature grid, testimonial,
  pricing teaser, and closing CTA. Use when the brief asks for a "landing
  page", "marketing site", "homepage", or "product launch page".
triggers:
  - "landing page"
  - "landing"
  - "homepage"
  - "marketing site"
  - "product launch"
  - "saas landing"
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
    requires: [typography-hierarchy, anti-ai-slop, accessibility-baseline, laws-of-ux]
---

# SaaS Landing Page Skill

Produce a single-file SaaS landing page that sells one product with one idea.

## Workflow

1. **Read the active DESIGN.md** (injected above). Hero, cards, and CTAs all
   pull color, type, spacing, and radius from its tokens. Do not invent
   values - `var(--token)` only.
2. **Name the product and the promise.** From the brief, derive a concrete
   product name, a one-line promise, and the single primary action
   (Start trial / Book demo / Get started). Write real copy - no
   "Feature One / Your Company Here" placeholders.
3. **Lay out the sections in this order:**
   - Sticky nav: wordmark left, 4-5 links, primary CTA button right.
   - Hero: one H1 (max ~8 words), one supporting paragraph, two buttons
     (primary + secondary), and a framed product-visual placeholder.
   - Logo strip: 5-6 customer names, muted, evenly spaced.
   - Feature grid: 6 cards, each with a short title (<=5 words) and a
     1-2 sentence benefit - not a spec list.
   - Testimonial: one quote with name, role, company.
   - Pricing teaser: 2-3 plan cards, prices in the brief's currency,
     feature bullets (<=5 per card), one highlighted plan.
   - Closing CTA band + slim footer (Product / Company / Legal columns).
4. **Hold the craft bar:**
   - One H1 on the page; H2 per section; hierarchy by scale, not color.
   - Primary color used for actions only - never as decoration.
   - Section rhythm uses the spacing scale (`--section-y-*` or space
     tokens); alternate surface/background bands for breathing room.
   - Every interactive element gets a visible focus state; buttons are
     >=44px tall; contrast of muted text on band backgrounds >= 4.5:1.
   - Responsive: single column under 768px, nav collapses to a simple
     stacked or hamburger-free link row.
5. **Output one self-contained `index.html`** - embedded `<style>`, no
   external requests, no JavaScript unless the brief demands it.

## Anti-patterns

- Stock gradients behind the hero with unreadable overlay text.
- Six equally-sized features that all claim to be "powerful".
- More than one accent hue per screen; ember/red reserved for errors.
- Lorem ipsum, "Unlock the power of...", "Revolutionize...".
