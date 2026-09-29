---
name: splatstudio-glass-theme-picker
description: |
  Glassmorphism appearance / theme picker panel — a "Select or customize a
  theme" surface with preset theme cards and a live custom accent color.
  Use when the brief asks for an "appearance panel", "theme picker",
  "select or customize a theme", "theme settings", or "glass settings UI".
triggers:
  - "theme picker"
  - "select or customize a theme"
  - "appearance panel"
  - "theme settings"
  - "glass settings"
  - "customize a theme"
od:
  mode: prototype
  platform: desktop
  scenario: design
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [state-coverage, accessibility-baseline, laws-of-ux, color]
---

# Glass Theme Picker Skill

Produce the Appearance surface where a user **selects or customizes a theme**:
a glass panel with preset theme cards, a live preview, and a custom accent.

## Workflow

1. **Read the active DESIGN.md** (injected above) for type and the neutral
   surfaces; the glass recipe and preset gradients are this template's own.
2. **Six preset themes** in a two-column grid, each card showing a mini
   gradient thumbnail, the theme name, and its accent swatch. Mark the active
   one with a check and a visible ring — state is never color-only.
3. **A "Customize" section:** a color input for the accent, plus a small live
   preview (button + card + link) that updates as the accent changes.
4. **A preview strip** at the top showing the currently-selected theme applied
   to a glass card, so selection has an immediate visible effect.
5. **Interaction contract:** clicking a preset updates the preview, the accent,
   and the `aria-pressed` state; the custom color input clears the preset
   selection. Announce the active theme in a polite live region.
6. **Output one self-contained `index.html`.** Tailwind via the Play CDN for
   the prototype; production output should compile Tailwind.

## Preset themes

| Theme | Gradient | Accent |
|---|---|---|
| Aurora | violet → pink → amber | `#7C3AED` |
| Ocean | sky → cyan → indigo | `#0EA5E9` |
| Ember | rose → orange → yellow | `#F43F5E` |
| Forest | emerald → teal → lime | `#10B981` |
| Orchid | fuchsia → purple → blue | `#A855F7` |
| Slate | gray → zinc → neutral | `#64748B` |

## Anti-patterns

- Theme cards that show only a color dot with no name or preview.
- Selection communicated by color alone (needs a check/ring + live-region text).
- A custom accent that does not update the preview until page reload.
- Glass panes over a flat white page (blur becomes invisible).
