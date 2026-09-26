export const PRODUCT_NAME = "Open Design";

export const INTERNAL_PACKAGES = [
  { directory: "packages/release", name: "@saascodex/release" },
  { directory: "packages/components", name: "@saascodex/components" },
  { directory: "packages/contracts", name: "@saascodex/contracts" },
  { directory: "packages/registry-protocol", name: "@saascodex/registry-protocol" },
  { directory: "packages/sidecar-proto", name: "@saascodex/sidecar-proto" },
  { directory: "packages/launcher-proto", name: "@saascodex/launcher-proto" },
  { directory: "packages/platform", name: "@saascodex/platform" },
  { directory: "packages/sidecar", name: "@saascodex/sidecar" },
  { directory: "packages/download", name: "@saascodex/download" },
  { directory: "packages/host", name: "@saascodex/host" },
  { directory: "packages/agui-adapter", name: "@saascodex/agui-adapter" },
  { directory: "packages/plugin-runtime", name: "@saascodex/plugin-runtime" },
  { directory: "packages/diagnostics", name: "@saascodex/diagnostics" },
  { directory: "apps/daemon", name: "@saascodex/daemon" },
  { directory: "apps/web", name: "@saascodex/web" },
  { directory: "apps/desktop", name: "@saascodex/desktop" },
  { directory: "apps/packaged", name: "@saascodex/packaged" },
] as const;

export const DESKTOP_LOG_ECHO_ENV = "OD_DESKTOP_LOG_ECHO";
export const WEB_STANDALONE_HOOK_CONFIG_ENV = "OD_TOOLS_PACK_WEB_STANDALONE_HOOK_CONFIG";
export const WEB_STANDALONE_RESOURCE_NAME = "saascodex-web-standalone";
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
