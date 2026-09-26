export const PRODUCT_NAME = "Open Design";
export const DESKTOP_LOG_ECHO_ENV = "OD_DESKTOP_LOG_ECHO";
export const WEB_STANDALONE_HOOK_CONFIG_ENV = "OD_TOOLS_PACK_WEB_STANDALONE_HOOK_CONFIG";
export const WEB_STANDALONE_RESOURCE_NAME = "saascodex-web-standalone";
export const ELECTRON_BUILDER_ASAR = false;
export const ELECTRON_BUILDER_BUILD_DEPENDENCIES_FROM_SOURCE = false;
export const ELECTRON_BUILDER_NODE_GYP_REBUILD = false;
export const ELECTRON_BUILDER_NPM_REBUILD = false;
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
export const NSIS_INSTALLER_LANGUAGE_BY_WEB_LOCALE = {
  en: "en_US",
  fa: "fa_IR",
  "pt-BR": "pt_BR",
  ru: "ru_RU",
  "zh-CN": "zh_CN",
  "zh-TW": "zh_TW",
} as const;
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
