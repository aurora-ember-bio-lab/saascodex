# SplatStudio desktop (Tauri)

A thin **Tauri v2** native shell over the local daemon. The window loads
`src/index.html`, which checks `http://127.0.0.1:7456/api/health` and forwards
to the daemon (which serves the web UI). If the daemon is not running it shows
a hint instead of a blank window.

Chosen over Electron for the installer: a Rust/WebView shell ships a much
smaller binary and needs no bundled Node runtime. (The repo's existing Electron
packaging under `tools/pack` remains available for the full desktop build.)

## Layout

```
desktop/tauri/
  src/index.html              # forwards to the daemon
  src-tauri/Cargo.toml        # Tauri v2 crate
  src-tauri/tauri.conf.json   # window + bundle config
  src-tauri/src/main.rs       # minimal shell
  src-tauri/icons/            # generated icon set (see below)
```

## Build locally

Requires the Rust toolchain and the platform's Tauri prerequisites
(<https://tauri.app/start/prerequisites/>).

```bash
cd desktop/tauri

# one-time: generate the platform icon set from the brand PNG
npx --yes @tauri-apps/cli@^2 icon ../../assets/brand/icon.png

# dev window
npx --yes @tauri-apps/cli@^2 dev

# installers (.dmg/.AppImage/.msi/.nsis depending on the OS)
npx --yes @tauri-apps/cli@^2 build
```

Installers land under `src-tauri/target/release/bundle/`.

## Installers in CI

[`.github/workflows/desktop.yml`](../../.github/workflows/desktop.yml) builds the
installers for Windows (NSIS/MSI), macOS (`.dmg`, universal), and Linux
(`.AppImage`/`.deb`) and attaches them to the GitHub Release for a `v*` tag.

## Pointing at a hosted daemon

To wrap the hosted deployment instead of a local daemon, change the
`splatstudio-daemon-url` meta in `src/index.html` (e.g.
`https://app.splatstudio.app`).
