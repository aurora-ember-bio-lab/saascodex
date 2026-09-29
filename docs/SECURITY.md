# Security scanning

SplatStudio uses [Trivy](https://trivy.dev) to scan the source tree and the
runtime image for vulnerable dependencies, secrets, and misconfiguration.
Findings surface in the GitHub **Security → Code scanning** tab as SARIF.

## What runs

| Where | Config | What it scans |
|---|---|---|
| `.github/workflows/security.yml` | `trivy.yaml`, `.trivyignore` | repo filesystem (`vuln,secret,misconfig`) + the built `deploy/Dockerfile` image |
| `.github/workflows/splatstudio-ci.yml` | — | `pnpm guard`, `pnpm check:skills`, web typecheck |

`security.yml` runs on pull requests, pushes to `main`, a weekly schedule, and
manual dispatch. It reports at `HIGH`/`CRITICAL` and currently **reports
without failing** (`exit-code: 0`) so the baseline can be triaged; flip
`exit-code` to `'1'` in the workflow once the repo is clean to make it a gate.

## Run it locally

Trivy is available as a binary or a container. With Docker:

```bash
# Source tree (uses trivy.yaml + .trivyignore)
docker run --rm -v "$PWD:/work" -w /work aquasec/trivy:latest \
  fs --config trivy.yaml --scanners vuln,secret,misconfig --severity HIGH,CRITICAL .

# A narrow, fast run while iterating
docker run --rm -v "$PWD:/work" -w /work aquasec/trivy:latest \
  fs --config trivy.yaml apps/daemon/src

# The runtime image
docker build -f deploy/Dockerfile -t splatstudio:local .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest \
  image --severity HIGH,CRITICAL splatstudio:local
```

## Triage

1. Read the finding in the Security tab (or the local SARIF/table output).
2. Prefer **fixing** — upgrade the dependency or patch the config. Dependabot is
   the first stop for dependency CVEs.
3. If a finding is a false positive or has no fix and is not reachable, add the
   ID to [`.trivyignore`](../.trivyignore) **with a one-line justification and a
   tracking reference**.
4. Re-run to confirm the SARIF upload clears the alert.

## Hardening checklist

- [ ] `OD_API_TOKEN` and `JWT_SECRET` are 32-byte random values (see [AUTH.md](./AUTH.md))
- [ ] `DATABASE_URL` uses TLS outside local compose
- [ ] Only `SPLATSTUDIO_ALLOWED_ORIGINS` may call `/api` in hosted mode
- [ ] The docker image runs as non-root (`splatstudio` user) with `no-new-privileges`
- [ ] `security.yml` `exit-code` flipped to `'1'` once the baseline is clean

## Pruning upstream workflows (private fork)

The checkout carries many upstream workflows under `.github/workflows/` that
target Nexu's runner fleet and release infra; they will fail on this fork. The
fork-relevant automation is `security.yml` and `splatstudio-ci.yml`. Disable the
rest under **Settings → Actions → General** (or delete them) when the repo goes
private.
