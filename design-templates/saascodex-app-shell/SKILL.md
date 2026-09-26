---
name: saascodex-app-shell
description: |
  Authenticated SaaS application shell in a single HTML file - fixed
  sidebar, top bar with search and avatar, page header with primary
  action, KPI row, and a data table with status badges. Use when the
  brief asks for an "app shell", "workspace", "admin layout", "settings
  area", or "SaaS dashboard".
triggers:
  - "app shell"
  - "workspace ui"
  - "admin layout"
  - "saas dashboard"
  - "settings page"
  - "web app layout"
od:
  mode: prototype
  platform: desktop
  scenario: operations
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [state-coverage, accessibility-baseline, form-validation, laws-of-ux]
---

# SaaS App Shell Skill

Produce the authenticated frame of a SaaS product - navigation, hierarchy,
and one real working page inside it.

## Workflow

1. **Read the active DESIGN.md** (injected above). Shell chrome (sidebar,
   bars, cards, badges) is built only from its tokens.
2. **Pick the product context** from the brief (billing, analytics,
   content ops, support...). Derive a plausible product name, workspace
   name, nav items (5-7), and the page's purpose. Real labels only.
3. **Lay out the shell:**
   - Left sidebar (~240px): wordmark + workspace switcher, nav sections
     with active state (accent tint, not color alone - add a marker),
     bottom cluster with plan badge ("Free trial - 4 days left" style)
     and user row.
   - Top bar: breadcrumb or page context left; search input, help icon,
     notification dot + avatar right.
   - Page header: H1 + one-line description left, one primary action
     (and at most one secondary) right.
   - KPI row: 3-4 metric cards, each with label, value, and delta
     (delta color + arrow symbol, never color alone).
   - Content: one real table (6-8 rows) with sortable-looking headers,
     status badges (2 states visible), row actions; or a settings form
     if the brief is a settings page.
   - Empty/edge state example visible somewhere (skeleton, empty row, or
     inline alert) - the page must show more than the happy path.
4. **Hold the craft bar:**
   - Sidebar collapses to icons (<1024px) or becomes a top drawer; table
     scrolls horizontally rather than truncating numbers.
   - Focus order: sidebar -> top bar -> page actions -> content.
   - Badges, deltas, and active nav each pair color with text/icon.
   - Density: table rows 44-52px; inputs >=40px; nothing under 13px.
5. **Output one self-contained `index.html`** - embedded `<style>`, no
   external requests, no JavaScript unless the brief demands it.

## Anti-patterns

- Placeholder nav ("Section 1") or fake rows ("Item 5", "Lorem Corp").
- Color-only status (green dot with no label).
- More than one primary button visible at once.
- Nested cards inside cards inside cards.
