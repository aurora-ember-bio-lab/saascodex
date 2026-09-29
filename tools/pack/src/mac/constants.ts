export const PRODUCT_NAME = "Open Design";

export const INTERNAL_PACKAGES = [
  { directory: "packages/release", name: "@splatstudio/release" },
  { directory: "packages/components", name: "@splatstudio/components" },
  { directory: "packages/contracts", name: "@splatstudio/contracts" },
  { directory: "packages/registry-protocol", name: "@splatstudio/registry-protocol" },
  { directory: "packages/sidecar-proto", name: "@splatstudio/sidecar-proto" },
  { directory: "packages/launcher-proto", name: "@splatstudio/launcher-proto" },
  { directory: "packages/platform", name: "@splatstudio/platform" },
  { directory: "packages/sidecar", name: "@splatstudio/sidecar" },
  { directory: "packages/download", name: "@splatstudio/download" },
  { directory: "packages/host", name: "@splatstudio/host" },
  { directory: "packages/agui-adapter", name: "@splatstudio/agui-adapter" },
  { directory: "packages/plugin-runtime", name: "@splatstudio/plugin-runtime" },
  { directory: "packages/diagnostics", name: "@splatstudio/diagnostics" },
  { directory: "apps/daemon", name: "@splatstudio/daemon" },
  { directory: "apps/web", name: "@splatstudio/web" },
  { directory: "apps/desktop", name: "@splatstudio/desktop" },
  { directory: "apps/packaged", name: "@splatstudio/packaged" },
] as const;

export const DESKTOP_LOG_ECHO_ENV = "OD_DESKTOP_LOG_ECHO";
export const WEB_STANDALONE_HOOK_CONFIG_ENV = "OD_TOOLS_PACK_WEB_STANDALONE_HOOK_CONFIG";
export const WEB_STANDALONE_RESOURCE_NAME = "splatstudio-web-standalone";
export const ELECTRON_BUILDER_ASAR = false;
export const ELECTRON_BUILDER_BUILD_DEPENDENCIES_FROM_SOURCE = false;
export const ELECTRON_REBUILD_MODE = "sequential" as const;
export const ELECTRON_REBUILD_NATIVE_MODULES = ["better-sqlite3"] as const;
export const ELECTRON_BUILDER_FILE_PATTERNS = [
  "**/*",
  "!**/node_modules/.bin",
  "!**/node_modules/electron{,/**/*}",
  "!**/*.map",
  "!**/*.tsbuildinfo",
  "!**/.next/cache",
  "!**/.next/cache/**",
  "!**/node_modules/better-sqlite3/build/Release/obj",
  "!**/node_modules/better-sqlite3/build/Release/obj/**",
  "!**/node_modules/better-sqlite3/deps",
  "!**/node_modules/better-sqlite3/deps/**",
] as const;
// Keep Electron native UI resources aligned with the Web UI locale set.
// Electron uses underscore-separated locale ids; its base "es" resource
// covers the app's es-ES dictionary.
export const MAC_ELECTRON_LANGUAGES = [
  "en",
  "de",
  "zh_CN",
  "zh_TW",
  "pt_BR",
  "es",
  "ru",
  "fa",
  "ar",
  "ja",
  "ko",
  "pl",
  "hu",
  "fr",
  "uk",
  "tr",
] as const;
