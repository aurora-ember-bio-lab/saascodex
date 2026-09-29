---
name: splatstudio-brand-mark
description: |
  Generates a project logo and a matching favicon set as inline SVG - a
  gradient glyph mark plus a wordmark, previewed at every icon size on light
  and dark surfaces, with the favicon wired in. Use when the brief asks for a
  "logo", "favicon", "app icon", "brand mark", or "generate a logo for the
  project".
triggers:
  - "logo"
  - "favicon"
  - "app icon"
  - "brand mark"
  - "generate logo"
  - "site icon"
od:
  mode: prototype
  platform: responsive
  scenario: design
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [typography-hierarchy, accessibility-baseline, anti-ai-slop]
---

# Brand Mark Skill

Produce a project's **logo and favicon** in one self-contained HTML file:
an SVG glyph, a wordmark lockup, an icon-size matrix, and the favicon wired
into the document head as a data URI.

## Workflow

1. **Read the active DESIGN.md** (injected above). The mark's accent comes
   from the design system's accent token; there is no separate brand palette.
2. **Derive the mark from the brief.** Pick one geometric idea (a letterform,
   a monogram, an abstract glyph) — one idea, drawn in one weight. No clip-art,
   no literal objects.
3. **Deliver four things:**
   - **Glyph** — a square, rounded-corner SVG with the accent as a gradient
     (or flat), the glyph in white, on a fixed viewBox (`0 0 64 64`).
   - **Wordmark lockup** — glyph + product name set in the display face with
     `-0.02em` tracking; horizontal lockup plus a stacked variant.
   - **Icon matrix** — the glyph rendered at 16, 24, 32, 48, 64, 128 and 512 px
     on a light surface and a dark surface, so small-size legibility is proven.
   - **Favicon** — the same glyph as an SVG data URI in
     `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">`,
     plus the recommended PNG exports (16/32/180/512) and `manifest` entries
     listed in the notes.
4. **Hold the craft bar:** the glyph must read at 16px (test the matrix); the
   mark must not rely on color alone to be recognizable; provide a monochrome
   (single-color) variant for favicons that must render without gradients.
5. **Output one self-contained `index.html`** with all previews and the
   favicon wired in. Hand off the raw SVG markup for export.

## Favicon export notes

- `favicon.svg` — the SVG glyph, for modern browsers.
- `favicon-32.png`, `favicon-16.png` — raster fallbacks.
- `apple-touch-icon.png` (180×180) — opaque background, safe margins.
- `icon-512.png` + `maskable` — for the web app manifest; keep the glyph
  inside the inner 80% for maskable icons.

## Anti-patterns

- A mark that only works at 512px and turns to mush at 16px.
- Gradient-only marks with no monochrome fallback for the favicon.
- Clip-art or stock symbols; a mark must be one original geometric idea.
- Wordmark lockups with default letter-spacing, or three competing weights.
