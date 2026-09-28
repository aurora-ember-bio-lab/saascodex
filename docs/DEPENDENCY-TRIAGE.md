# Dependency triage

Baseline scan of the SaaSCodex dependency tree, captured 2026-09-28 with
`pnpm audit` (and corroborated by Dependabot on the GitHub repo).

## Summary

| Source | Critical | High | Moderate | Low | Total |
|---|---|---|---|---|---|
| `pnpm audit` (advisories) | 2 | 55 | 43 | 8 | **108** |
| Dependabot (default branch) | 5 | 71 | 108 | 35 | **219** |

The two numbers differ because Dependabot counts each affected
path/version-range separately and includes dev/build tooling; `pnpm audit`
dedupes by advisory.

## Critical

Both criticals are **Next.js** and are fixed by the same upgrade:

| Package | Advisory | Fix |
|---|---|---|
| `next` | Unauthenticated RCE in Image Optimization | `>=16.3.3` |
| `next` | Unauthenticated RCE on Windows-hosted `serve` | `>=16.3.3` |

Pinned version: **16.2.6** (`apps/web`). This is the top remediation.

## High (unique modules)

| Package | Fix | Area |
|---|---|---|
| `next` | `>=16.3.3` | web runtime (also clears the criticals) |
| `vite` | `>=7.3.5` | web dev/build |
| `multer` | `>=2.3.0` | daemon uploads |
| `sharp` | `>=0.35.0` | image processing (libvips CVEs) |
| `postcss` | `>=8.5.18` | CSS build |
| `js-yaml` | `>=4.3.0` | config parsing |
| `nanoid` | `>=5.1.16` | ids |
| `lodash-es` | `>=4.18.0` | utility |
| `protobufjs` | `>=8.4.1` | transitive (telemetry/proto) |
| `@xmldom/xmldom` | `>=0.9.12` | transitive (via `mermaid` etc., 23 advisories) |
| `dompurify` | see advisory | transitively via renderers (10 advisories) |
| `fast-uri` | `>=3.1.6` | transitive |
| `form-data` | `>=4.0.6` | transitive |
| `extract-zip` | no fix | dev/build tooling |
| `adm-zip`, `image-size`, `builder-util-runtime`, `app-builder-lib`, `electron` | bump | dev/build tooling (packaging) |

Dependency families with the most advisories: `@xmldom/xmldom` (23), `next`
(11), `dompurify` (10), `nanoid` (8).

## Remediation plan

1. **`next` → ≥16.3.3** (clears both criticals + the Next highs). One bump in
   `apps/web/package.json`, then `pnpm install`, `pnpm --filter @saascodex/web
   typecheck`, web build, and the web test suite.
2. **Direct runtime deps**: `multer`, `sharp`, `postcss`, `js-yaml`, `nanoid`,
   `lodash-es`, `vite`, `protobufjs`.
3. **Transitive**: `@xmldom/xmldom` / `dompurify` / `fast-uri` — bump the direct
   parents (`mermaid`, renderer libs) or add `pnpm.overrides`; otherwise track
   upstream.
4. **Dev/build tooling** (`electron`, `app-builder-lib`, `extract-zip`,
   `adm-zip`, `image-size`): bump with the desktop-packaging pass; not shipped
   in the runtime image.
5. Automate: [`.github/dependabot.yml`](../.github/dependabot.yml) opens grouped
   weekly PRs.

## Gating

The Trivy workflow (`.github/workflows/security.yml`) currently **reports**
(`exit-code: 0`). Flip it to `'1'` once step 1 lands and the `HIGH/CRITICAL`
baseline is clean, so new criticals fail CI instead of accumulating.

## Reproduce

```bash
pnpm audit --json > audit.json
# or the container-based Trivy scan:
docker run --rm -v "$PWD:/work" -w /work aquasec/trivy:latest \
  fs --config trivy.yaml --scanners vuln --severity HIGH,CRITICAL .
```
