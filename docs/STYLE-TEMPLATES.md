# Style templates: glassmorphism, themes, and brand marks

SaaSCodex ships a set of **style templates** alongside the general generate
templates. They live in [`design-templates/`](../design-templates/) and follow
the same contract as every other template: a `SKILL.md` (frontmatter + workflow)
and a self-contained `example.html` the agent uses as a reference.

## Glassmorphism (Tailwind)

Frosted, translucent panes over a vivid gradient field, built from Tailwind
utility classes. The look rests on one rule: **blur is only visible when
something colorful sits behind it** — so every pane floats over a gradient,
never over flat white.

The shared glass recipe:

```
backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl
```

| Template | Path | What it generates |
|---|---|---|
| Glass landing | `design-templates/saascodex-glass-landing/` | Glass marketing landing page with a live color-variation switcher |
| Glass theme picker | `design-templates/saascodex-glass-theme-picker/` | The **Appearance** panel: "Select or customize a theme" with presets + custom accent |
| Brand mark | `design-templates/saascodex-brand-mark/` | Project **logo + favicon** set as inline SVG, with an icon-size matrix |

Tailwind is loaded through the Play CDN in the examples for zero-build
prototyping. Production output should compile Tailwind instead of using the
CDN.

### Color variations

The glass templates share one palette of four variations, each a gradient field
plus an accent that stays in contrast:

| Variation | Gradient field | Accent |
|---|---|---|
| Aurora | violet → pink → amber | `#7C3AED` |
| Ocean | sky → cyan → indigo | `#0EA5E9` |
| Ember | rose → orange → yellow | `#F43F5E` |
| Forest | emerald → teal → lime | `#10B981` |

The theme picker adds **Orchid** (fuchsia → purple → blue) and **Slate**
(gray → zinc → neutral), and lets the user set a **custom accent** through a
color input that updates the preview live.

## Appearance: select or customize a theme

`saascodex-glass-theme-picker` is the reference implementation of the
Appearance surface. Its interaction contract:

- six preset theme cards, each with a gradient thumbnail, a name, and an accent
  swatch;
- the active card is marked with a check **and** a visible ring — state is never
  color-only;
- a custom accent color input clears the preset selection and updates the
  preview immediately;
- a polite live region announces the active theme for screen readers;
- a reset control restores the default (Aurora).

## Logo and favicon

`saascodex-brand-mark` generates a project's logo and favicon in one file:

- an SVG **glyph** (fixed `0 0 64 64` viewBox, rounded corners, accent
  gradient) and a **wordmark lockup** (horizontal + stacked);
- an **icon matrix** at 16 / 24 / 32 / 48 / 64 / 128 px on light and dark
  surfaces, so small-size legibility is proven;
- a **monochrome** variant for favicons that drop gradients;
- the **favicon** wired into the document head as an SVG data URI, plus the
  recommended raster export set (`favicon-16/32.png`, `apple-touch-icon.png`
  180×180, `icon-512.png` with a `maskable` safe zone).

## UI languages

The app ships a curated **12-language** UI set:

`en`, `de`, `fr`, `es-ES`, `pt-BR`, `it`, `ja`, `ko`, `zh-CN`, `ar`, `ru`,
`no` (Norwegian Bokmål).

- Dictionaries live in `apps/web/src/i18n/locales/` and register in
  `apps/web/src/i18n/index.tsx`; the union and the picker list are in
  `apps/web/src/i18n/types.ts`.
- `zh-TW` was retired; every Chinese variant now resolves to `zh-CN`, which
  carries the Han content tables.
- Norwegian browser tags (`nb-NO`, `nn-NO`) resolve to `no`.
- `no` follows the partial-coverage pattern used by most non-tier-1 locales:
  explicit Norwegian overrides plus an `...en` spread for not-yet-translated
  keys. `zh-CN` and `ja` remain the fully-explicit tier-1 locales.

## Running locally

```bash
cd apps/web
pnpm dev        # http://localhost:3000
```

The template examples are static reference files; the agent copies the recipe
into generated output. To preview one directly, open its `example.html` in a
browser (the glass templates load Tailwind from the Play CDN, so an internet
connection is needed for the reference preview only).
