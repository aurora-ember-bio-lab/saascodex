---
name: splatstudio-auth
description: |
  Authentication screens in a single HTML file - sign-in with social
  buttons, or sign-up with password requirements, plus inline validation
  states. Use when the brief asks for "login", "sign in", "sign up",
  "register", "auth screen", or "password reset".
triggers:
  - "login"
  - "sign in"
  - "sign up"
  - "register"
  - "auth screen"
  - "password reset"
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
    requires: [form-validation, accessibility-baseline, state-coverage, anti-ai-slop]
---

# Auth Screen Skill

Produce a focused authentication screen that gets out of the way.

## Workflow

1. **Read the active DESIGN.md** (injected above). Fields, buttons, and
   error states use its tokens - `--danger`/`--warn` for validation only.
2. **Choose the screen from the brief** (sign-in default). Derive the
   product name, one welcome line, and the recovery/alternate links that
   pair with it.
3. **Lay out the screen:**
   - Split layout: form panel (max ~420px) + brand panel with a value
     quote or product visual. On narrow screens the brand panel hides.
   - Form: H1, one-line subtitle, social buttons (2, if present) with an
     "or continue with email" divider, then labeled fields.
   - Password field includes a show/hide affordance (text toggle) and -
     on sign-up - a requirements list with at least one met and one
     unmet state.
   - Inline validation examples: one field with an error (message below
     the field, `aria-describedby` pattern) and one with a success hint.
   - Primary button (full width), then alternate action link
     ("Create account" / "Forgot password?"), plus legal microcopy.
4. **Hold the craft bar:**
   - Labels above fields, never placeholder-only; inputs >=44px tall;
     `autocomplete` attributes (`username`, `current-password`, `email`).
   - Errors announce via `role="alert"`; the submit button is reachable
     and visually complete with the error state shown.
   - Password requirements are text + check marks, not color alone.
   - No dead social buttons without accessible names.
5. **Output one self-contained `index.html`** - embedded `<style>`, no
   external requests, no JavaScript unless the brief demands it.

## Anti-patterns

- Centered card floating in an empty void with no brand context.
- "Enter text..." as the only field label.
- Errors that shake or rely on red alone to communicate state.
- Requiring email format rules stricter than `name@host.tld`.
