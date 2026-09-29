---
name: splatstudio-glass-landing
description: |
  Glassmorphism marketing landing page in Tailwind — frosted translucent
  panes over a vivid gradient field, with four ready color variations
  (aurora, ocean, ember, forest). Use when the brief asks for a "glass",
  "glassmorphism", "frosted", "translucent", or "Apple-style blur" page,
  or asks for a landing page in a modern glass aesthetic.
triggers:
  - "glassmorphism"
  - "glass landing"
  - "frosted glass"
  - "translucent ui"
  - "backdrop blur"
  - "glass style"
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

# Glassmorphism Landing Skill

Produce a single-file landing page in the glassmorphism style, built with
Tailwind utility classes. The whole look rests on one rule: **blur is only
visible when something colorful sits behind it** — so every glass pane floats
over a gradient field, never over flat white.

## The glass recipe

One shared pane recipe, applied to every surface:

```
backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl
```

Layering rules:

- The page background is a vivid gradient (two or three hues). Panes are the
  only translucent layer on top of it.
- One accent hue drives gradients and primary actions; keep the rest neutral.
- Text on glass is white at 90-100% opacity for headings and 60-70% for body;
  never place low-contrast gray on a bright glass pane.
- Add a 1px `border-white/20` edge to every pane — it is what makes the glass
  read as a physical sheet instead of a blurry rectangle.
- Round corners generously (`rounded-2xl` / `rounded-3xl`); glass reads as
  soft, not sharp.

## Color variations

Ship the four variations below as a selectable set; the example exposes them
as a row of theme chips that swap the gradient field and accent live.

| Variation | Gradient field | Accent |
|---|---|---|
| aurora | violet → pink → amber | `#7C3AED` |
| ocean | sky → cyan → indigo | `#0EA5E9` |
| ember | rose → orange → yellow | `#F43F5E` |
| forest | emerald → teal → lime | `#10B981` |

## Workflow

1. **Read the active DESIGN.md** (injected above). Where it defines color and
   type, use those tokens for text and the primary action; the glass recipe
   and gradient are this style's own contribution.
2. **Name the product and the promise** from the brief. Real copy only.
3. **Lay out:** sticky glass nav, hero with one H1 + one paragraph + CTA over
   the gradient, a theme-variation row, a 3-up grid of glass feature cards,
   one glass testimonial pane, and a closing CTA.
4. **Hold the craft bar:** one H1; primary CTA uses the accent; body text on
   glass stays >= 4.5:1; focus rings visible on a translucent surface; the
   layout collapses to one column under 768px.
5. **Output one self-contained `index.html`.** Tailwind is loaded via the Play
   CDN for the prototype; production output should compile Tailwind instead.

## Anti-patterns

- Glass panes over a flat, near-white background (the blur disappears).
- More than two accent hues on screen at once.
- Blurring text, or stacking glass on glass on glass until contrast dies.
- Frosted panels with sharp square corners.
