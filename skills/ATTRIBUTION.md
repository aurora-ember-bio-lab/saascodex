# Vendored skill attribution

SaaSCodex's skill catalog includes third-party skills imported from the
following repositories. All imported skills are MIT-licensed; the full license
texts are preserved in [`_licenses/`](./_licenses/).

## agent-skills (Addy Osmani)

- Source: https://github.com/addyosmani/agent-skills
- Imported at commit: `2686b620fc1fed2e8f60c704839c766b8594c6b6`
- Imported folders: `agent-skills/skills/*` (25 skills)
- License: MIT, Copyright (c) 2025 Addy Osmani — see
  [`_licenses/agent-skills-LICENSE.txt`](./_licenses/agent-skills-LICENSE.txt)

## skills (Microsoft)

- Source: https://github.com/microsoft/skills
- Imported at commit: `23d0dac5f83f268166a17f0bc7dc6c73dc348a33`
- Imported folders: `.github/skills/*` and `.github/plugins/*/skills/*`
  (192 skills; duplicate folders `applicationinsights-web-ts` and
  `entra-agent-id` resolved to the curated `.github/skills/` copy)
- License: MIT, Copyright (c) Microsoft Corporation — see
  [`_licenses/microsoft-skills-LICENSE.txt`](./_licenses/microsoft-skills-LICENSE.txt)

## Notes

- Imported skills keep their original folder names and `SKILL.md`
  frontmatter; no content was modified. The only structural change is
  flattening into this directory, which matches SaaSCodex's flat
  `skills/<name>/SKILL.md` discovery.
- Skills without a frontmatter `name` derive their catalog id from the
  folder name.
