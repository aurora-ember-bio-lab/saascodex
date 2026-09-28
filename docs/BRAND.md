# Brand

**SaaSCodex** — local-first, full-stack design product.

| | |
|---|---|
| Product | SaaSCodex |
| Domain | **saascodex.com** |
| Author / org | **Aurora Ember Cyber Bio Lab** |
| Tagline | Ship interfaces with agent-grade craft |

## Assets

The logo, glyph, favicon, and machine-readable color tokens live in
[`assets/brand/`](../assets/brand/):

- `logo.svg` — primary lockup
- `logo-mark.svg` / `logo-mark-mono.svg` — glyph, gradient and monochrome
- `favicon.svg` — favicon glyph
- `palette.json` — colors, gradients, type

The web app serves the favicon from `apps/web/public/favicon.svg` (wired in
`apps/web/app/layout.tsx`), and the in-product design system packages the same
palette in
[`design-systems/saascodex/`](../design-systems/saascodex/) (`tokens.css`,
`DESIGN.md`, `components.html`).

## Palette

| Token | Hex |
|---|---|
| Aurora ink | `#0B0F0E` |
| Aurora mint | `#3BE8B0` |
| Indigo | `#4F46E5` |
| Ember amber | `#F5A524` |
| Ember red | `#FF5C5C` |
| Paper | `#F5F7F6` |

Gradient **aurora**: `#3BE8B0 → #4F46E5`.

## Typography

Display **Space Grotesk**, body **Inter**, mono **JetBrains Mono**.

## Voice

Concrete and craft-focused. Lead with what the user ships, not with
"unlock/revolutionize" filler. Ember color is reserved for state (warn/error),
mint for primary action.

## Where the brand appears

- `package.json` — `author`, `description`
- `apps/web/app/layout.tsx` — document title + favicon
- `apps/web/src/i18n/locales/*` — `app.brand`, localized titles
- `README.md`, `DESIGN.md`, `docs/` — product name and domain
- Plugin and marketplace manifests — publisher identity
