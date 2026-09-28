# Releasing

SaaSCodex ships source (this repo), a container image (GHCR), and a runnable
bundle artifact attached to each GitHub Release.

## What a release contains

| Artifact | What it is |
|---|---|
| `saascodex-<version>.tar.gz` | Runnable daemon bundle: `apps/daemon` (built `dist` + prod `node_modules`), `apps/web/out`, `skills/`, `design-systems/`, `craft/`, `prompt-templates/`, `plugins/_official/`, `data/`, `deploy/` |
| `SHA256SUMS` | Checksum of the artifact |
| `ghcr.io/<owner>/<repo>:<tag>` (+ `:latest`) | Container image built from `deploy/Dockerfile` |

The bundle runs on Node 24: `node apps/daemon/dist/cli.js --no-open`.

## Cutting a release

1. Make sure `main` is green (`security` + `saascodex-ci` workflows).
2. Tag and push:
   ```bash
   git tag v0.23.1
   git push origin v0.23.1
   ```
3. [`.github/workflows/release.yml`](../.github/workflows/release.yml) runs on the
   tag, and:
   - builds the web export and the daemon,
   - bundles prod dependencies (`pnpm deploy`) and packages the tarball +
     `SHA256SUMS` (`pnpm package:release`),
   - builds and pushes the image to GHCR,
   - creates the GitHub Release with generated notes and the artifact files.

You can also trigger it manually (`Actions → release → Run workflow`) and pass a
tag.

## Building the artifact locally

```bash
pnpm install
pnpm --filter @saascodex/web build
pnpm --filter @saascodex/daemon build
pnpm --filter @saascodex/daemon deploy --legacy --prod .release/daemon
pnpm exec tsx scripts/package-release.ts --daemon-dir .release/daemon --version v0.0.0-local
# -> dist-release/saascodex-v0.0.0-local.tar.gz + SHA256SUMS
```

`dist-release/` and `.release/` are gitignored.

## Installing a release

**Desktop installers (Tauri v2):** built by
[`.github/workflows/desktop.yml`](../.github/workflows/desktop.yml) for Windows
(NSIS/MSI), macOS (`.dmg`, universal), and Linux (`.AppImage`/`.deb`), and
attached to the tag release. The shell wraps the local daemon — see
[`desktop/tauri/README.md`](../desktop/tauri/README.md).

**Docker (recommended):**

```bash
docker pull ghcr.io/<owner>/<repo>:<tag>
SAASCODEX_IMAGE=ghcr.io/<owner>/<repo>:<tag> docker compose -f deploy/docker-compose.yml up -d
```

The one-click installer accepts an explicit image reference:

```bash
bash deploy/scripts/install.sh --image ghcr.io/<owner>/<repo>:<tag>
# or env-overridable default:
SAASCODEX_IMAGE=ghcr.io/<owner>/<repo>:<tag> bash deploy/scripts/install.sh
```

> On a private fork the GHCR package is **private**: authenticate first with
> `echo "$GITHUB_TOKEN" | docker login ghcr.io -u <user> --password-stdin`, or
> make the package public under the repo's Packages settings.

**Bundle:**

```bash
tar -xzf saascodex-<version>.tar.gz
cd saascodex-<version>
node apps/daemon/dist/cli.js --no-open --port 7456
```

Verify the download against `SHA256SUMS`:
`shasum -a 256 -c SHA256SUMS`.

## Versioning

The version comes from the root `package.json` (`0.23.1`), inherited from the
upstream baseline; bump it there and tag the same value. The release workflow
also passes the tag as the artifact version.

## Private repo + public releases

Keep the repository private and publish **releases** only: GitHub Releases on a
private repo can be made visible to everyone while code stays private (a
GitHub Team/Enterprise feature), or keep releases private too. The container
image visibility follows its GHCR package setting, independent of the repo.
