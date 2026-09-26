# SaaSCodex — DESIGN.md

> Product-level design contract for the SaaSCodex application.
> Author: Aurora Ember Cyber Bio Lab.
> Brand package: [`design-systems/saascodex/`](design-systems/saascodex/) — every render reads it.

SaaSCodex is a local-first, agent-native design workspace: brief in,
artifacts out (prototypes, decks, dashboards, images, video). The app UI,
the generated artifacts, and the marketing pages share one visual language.

## Brand

- **Name:** SaaSCodex · **Author:** Aurora Ember Cyber Bio Lab
- **Voice:** precise, calm, technical but human. No hype adjectives, no
  exclamation marks in product copy, sentence case everywhere.
- **House style:** dark-first aurora ink surfaces, single aurora-mint accent,
  ember warmth only for state. Full token contract in
  `design-systems/saascodex/tokens.css`.

## Product surfaces

1. **Studio** (creation surface) — chat, file workspace, sandboxed iframe
   preview. Dense but quiet: hairline borders, flat surfaces, one accent
   action per viewport.
2. **Catalog** (plugins / skills / design systems) — card grids with
   preview imagery, searchable, scannable metadata.
3. **Settings & billing** — forms and tables; clarity over personality.
4. **Marketing site** — the only surface allowed expressive motion.

## Color discipline

- Tokens are the only source of raw color values. Never hardcode hex in
  components; use `var(--token)`.
- One accent moment per screen. State colors (`--success` / `--warn` /
  `--danger`) never decorate.
- Generated artifacts are linted (`apps/daemon/src/lint-artifact.ts`):
  raw hex outside `:root`, accent overuse, and indigo laundering fail
  the pre-emit gate.

## Typography

- Display: Space Grotesk (600) · Body: Inter (400) · Mono: JetBrains Mono.
- Scale: 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64 px; line-height 1.5 / 1.2.
- Headings sentence case; uppercase only for ≤12px labels.

## Layout

- 12-col grid, 1200px container, 24/16/12px gutters by breakpoint.
- Section rhythm 80/48/32px desktop/tablet/phone.
- Whitespace separates; borders only where structure needs an edge.

## Motion

- 150ms micro-states, 200ms state changes, `cubic-bezier(0.2, 0, 0, 1)`.
- Motion explains change or it doesn't ship. No looping decoration in
  the product surface.

## Accessibility (non-negotiable)

- `--focus-ring` on every focusable element, visible in dark mode.
- Text contrast ≥ 4.5:1 against its actual background (`--fg` on
  `--bg` and `--fg` on `--surface` both pass by construction).
- Never encode state in color alone — pair with icon or label.

## Watermark & plan gating

- Free-trial exports carry the SaaSCodex watermark (see `docs/BILLING.md`).
- Watermarking is applied at export time, never at preview time, and is
  the only visual difference between Free and paid output.

## Extending the system

- New token names require a schema entry (`design-systems/_schema/`) plus
  declarations in every bundled package; see `design-systems/README.md`.
- Brand packages live in `design-systems/<slug>/` with `manifest.json`,
  `DESIGN.md`, `tokens.css`; folder slug must equal `manifest.id`.
- Run `pnpm guard` before committing design-system changes.
