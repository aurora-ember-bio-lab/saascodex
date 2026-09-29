# SplatStudio brand assets

Logo, favicon, and brand tokens for **SplatStudio** (`splatstudio.app`, by
**Aurora Ember Cyber Bio Lab**).

| File | Use |
|---|---|
| `logo.svg` | Primary horizontal lockup (glyph + wordmark) |
| `logo-mark.svg` | Glyph only — app icons, avatars, favicons |
| `logo-mark-mono.svg` | Monochrome glyph — contexts that drop gradients |
| `favicon.svg` | Favicon glyph (`0 0 64 64`) |
| `palette.json` | Machine-readable brand tokens |

## Glyph

A rounded-square (16px radius on a 64 grid) filled with the **aurora** gradient
— aurora mint `#3BE8B0` → indigo `#4F46E5` — carrying a bold white-on-ink `S`
monogram and a single **ember** dot (`#F5A524`) at the top-right.

## Color

| Token | Hex | Role |
|---|---|---|
| Aurora ink | `#0B0F0E` | Dark surface |
| Ink text | `#06110D` | Monogram on the light gradient |
| Aurora mint | `#3BE8B0` | Primary accent |
| Indigo | `#4F46E5` | Gradient end |
| Ember amber | `#F5A524` | Warm accent (state) |
| Ember red | `#FF5C5C` | Error state |
| Paper | `#F5F7F6` | Light surface |

These mirror the design-system tokens in
[`design-systems/splatstudio/tokens.css`](../../design-systems/splatstudio/tokens.css).

## Typography

- Display — **Space Grotesk** (wordmark, headings)
- Body — **Inter**
- Mono — **JetBrains Mono**

## Usage

- Keep clear space around the glyph equal to ≥25% of its size.
- Never stretch, recolor the gradient arbitrarily, or add effects.
- On a dark or busy background use `logo-mark-mono.svg`.
- Minimum glyph size: 16px (the monogram is designed to survive it).

## Favicon export set

Ship `favicon.svg` plus raster fallbacks generated from it:
`favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` (180×180, opaque),
and `icon-512.png` with a `maskable` safe zone (glyph inside the inner 80%).
