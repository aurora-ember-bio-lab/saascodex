# SaaSCodex Aurora

> Category: Starter
> The house brand for SaaSCodex. Dark-first, aurora-mint accent on deep
> ink surfaces, ember warmth reserved for state color. Built for product
> UI, dashboards, pricing pages, and agent-generated artifacts.

## Visual Theme & Atmosphere
Precise, calm, slightly luminous — a lab instrument at night, not a
neon arcade. Dark surfaces carry the layout; light comes from one
aurora-mint accent and generous whitespace. Warmth only appears where
the system reports state (ember amber/red). No glow, no neon bloom, no
rainbow gradients.

## Color Palette & Roles
- **Background:** `#0B0F0E` (deep aurora ink)
- **Surface:** `#131A18` (cards, modals, inputs)
- **Surface-warm:** `#1A1512` (ember-tinted third tier, rare, warm callouts)
- **Foreground:** `#ECF4F1` (primary text)
- **Foreground-2:** `#C9D8D2` (secondary headings)
- **Muted:** `#93A7A0` (secondary text, captions)
- **Meta:** `#6E827B` (timestamps, labels)
- **Border:** `#24322D` (card edges) · **Border-soft:** `#1B2622` (dividers)
- **Accent:** `#3BE8B0` (aurora mint) — primary CTAs, links, focus, one
  hero element per screen. On-accent text: `#06110D`
- **Success:** `#3DDC97`, **Warn:** `#F5A524` (ember amber), **Danger:** `#FF5C5C` (ember red)
Never pure black, never pure white. State colors never decorate.

## Typography Rules
- **Display / headings:** `"Space Grotesk", "Inter", -apple-system, system-ui, sans-serif`, weight 600
- **Body:** `"Inter", -apple-system, system-ui, sans-serif`, weight 400
- **Mono:** `ui-monospace, "JetBrains Mono", monospace`
- Scale (px): 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64
- Line-height: 1.5 body, 1.2 headings, tracking -0.01em at ≥32px
- Sentence-case headings by default; uppercase only for tiny labels (≤12px) with +0.08em tracking

## Component Stylings
- **Buttons:** 6px radius, 10px padding-block, 16px padding-inline. Primary = aurora-mint fill with `#06110D` label. Secondary = 1px `--border` outline, transparent fill, mint label on hover. Danger = ember-red fill, dark label.
- **Cards:** `--surface`, 1px `--border`, 10px radius, 20px padding, no shadow by default (`--elev-ring` when lift is needed).
- **Inputs:** `--surface` fill, 1px `--border`, 6px radius, 10px vertical padding, mint border on focus via `--focus-ring`.
- **Links:** `--accent`, underline on hover only.

## Layout Principles
- 12-column grid, 1200px max-width, 24px gutters desktop / 16px tablet / 12px phone.
- Hero: 40–60vh, content top-biased, never vertically centered.
- Sections: 80px vertical spacing desktop, 48px tablet, 32px phone.
- Whitespace is the separator. Hairline borders (`--border-soft`) only between unrelated top-level blocks.

## Depth & Elevation
Three levels, no more:
- **Flat (0):** default — everything.
- **Ring (1):** `--elev-ring`, 1px edge, for cards that need separation without lift.
- **Raised (2):** dropdowns, modals — 2px y-offset, 8px blur, foreground at 8% opacity.
No neumorphism, no glassmorphism, no glows.

## Do's and Don'ts
- ✅ One aurora-mint accent moment per screen (hero CTA OR active nav, not both fighting).
- ✅ Use `--surface-warm` only for genuinely warm callouts (ember announcements, welcome states).
- ✅ Dark surfaces stay flat; use borders, not shadows, for structure.
- ❌ No glows, bloom, neon, or multi-color gradient backgrounds.
- ❌ No state colors (green/amber/red) used decoratively.
- ❌ No pure `#000000` backgrounds or `#FFFFFF` text.

## Responsive Behavior
- **Desktop ≥ 1024px:** 12-col grid, 24px gutters.
- **Tablet 640–1023px:** 8-col grid, 16px gutters.
- **Phone < 640px:** 4-col grid, 12px gutters; hero drops to 40vh; section spacing to 32px.

## Agent Prompt Guide
- Paste the `tokens.css` `:root` block verbatim into the artifact's first `<style>`, then reference tokens via `var(--name)`.
- Never invent hex values outside the palette; if a brief needs one, use the closest token and leave an HTML comment noting the gap.
- Keep accents under control: the lint fails artifacts with accent overuse.
- Read tokens as roles, not values: `--accent` is "the thing to click", `--muted` is "the thing to skim".
