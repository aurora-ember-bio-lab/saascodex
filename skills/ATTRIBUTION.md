# Vendored skill attribution

SplatStudio's skill catalog includes third-party skills imported from the
following repositories. Licenses are permissive (MIT / Apache-2.0) unless noted;
license texts are preserved in [`_licenses/`](./_licenses/) and, where present,
alongside each imported skill folder.

## agent-skills (Addy Osmani)

- Source: https://github.com/addyosmani/agent-skills
- Imported at commit: `2686b620fc1fed2e8f60c704839c766b8594c6b6`
- Imported folders: `agent-skills/skills/*` (25 skills)
- License: MIT, Copyright (c) 2025 Addy Osmani — see
  [`_licenses/agent-skills-LICENSE.txt`](./_licenses/agent-skills-LICENSE.txt)

## skills (Microsoft)

- Source: https://github.com/microsoft/skills (docs: https://microsoft.github.io/skills/)
- Imported at commit: `23d0dac5f83f268166a17f0bc7dc6c73dc348a33`
- Imported folders: `.github/skills/*` and `.github/plugins/*/skills/*`
  (192 skills; duplicate folders `applicationinsights-web-ts` and
  `entra-agent-id` resolved to the curated `.github/skills/` copy)
- License: MIT, Copyright (c) Microsoft Corporation — see
  [`_licenses/microsoft-skills-LICENSE.txt`](./_licenses/microsoft-skills-LICENSE.txt)

## ui-skills (ibelick)

- Source: https://github.com/ibelick/ui-skills
- Imported at commit: `ee4596c4c86a5049ef9b9731f92e4f4fed0c04c1`
- Imported folders: `skills/*` (7 skills: baseline-ui, create-design-md,
  fixing-accessibility, fixing-metadata, fixing-motion-performance, improve-ui,
  ui-skills-root)
- License: see [`_licenses/ui-skills-LICENSE.txt`](./_licenses/ui-skills-LICENSE.txt)

## ui-ux-pro-max-skill (nextlevelbuilder)

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Imported at commit: `09170eec67eefd46a7ae85de61b40c194020f997`
- Imported folders: `.claude/skills/*` (5 skills: banner-design, brand, design,
  design-system, ui-styling). `slides` and `ui-ux-pro-max` already existed in the
  catalog and were left as-is.
- License: see [`_licenses/ui-ux-pro-max-LICENSE.txt`](./_licenses/ui-ux-pro-max-LICENSE.txt)

## skills (Anthropic)

- Source: https://github.com/anthropics/skills
- Imported at commit: `33375500bcea98d610eb30ce10ac4e59b89c390d`
- Imported folders: `skills/*` (7 new: academy-guide, claude-api,
  discernment-nudge, doc-coauthoring, internal-comms, webapp-testing, xlsx).
  Twelve names already existed in the catalog and were left as-is
  (algorithmic-art, brand-guidelines, canvas-design, docx, frontend-design,
  mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, theme-factory,
  web-artifacts-builder).
- License: most skills are Apache-2.0 with a per-skill `LICENSE.txt` kept in the
  copied folder. The document skills (`docx`, `pdf`, `pptx`, `xlsx`) are
  **source-available, not open source** as noted by Anthropic; `xlsx` is
  imported on that basis. `doc-coauthoring` ships no per-skill license file.
  Repo notices: [`_licenses/anthropic-skills-THIRD_PARTY_NOTICES.md`](./_licenses/anthropic-skills-THIRD_PARTY_NOTICES.md)

## Notes

- Imported skills keep their original folder names and `SKILL.md`
  frontmatter; no content was modified. The only structural change is
  flattening into this directory, which matches SplatStudio's flat
  `skills/<name>/SKILL.md` discovery.
- Skills without a frontmatter `name` derive their catalog id from the
  folder name.
- Re-running an import skips any folder that already exists, so the curated
  copy of a colliding skill is never overwritten.
