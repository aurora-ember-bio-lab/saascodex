import type { ReleaseChannel } from "@saascodex/release";

/**
 * @module protocol
 *
 * The SaaSCodex renderer host-bridge wire contract: the injected-global name
 * and version, client/updater constant registries, and every request/result
 * type that crosses the host bridge — including the {@link SaaSCodexHostBridge}
 * shape itself. Pure declarations only; depends on nothing else in the package.
 */

export const SAASCODEX_HOST_GLOBAL = "__od__";
export const SAASCODEX_HOST_VERSION = 2;

export const SAASCODEX_HOST_CLIENT_TYPES = Object.freeze({
  DESKTOP: "desktop",
} as const);

export type SaaSCodexHostClientType =
  (typeof SAASCODEX_HOST_CLIENT_TYPES)[keyof typeof SAASCODEX_HOST_CLIENT_TYPES];

export type SaaSCodexHostClient = {
  // BCP-47 locale string (e.g. "zh-CN", "pt-BR") the host process read from
  // the OS at startup. The renderer uses this so the packaged desktop app
  // can follow the OS language even when Chromium's built-in
  // `navigator.language` would have defaulted to en-US.
  osLocale?: string;
  platform?: string;
  type: SaaSCodexHostClientType;
};

export type SaaSCodexHostFailure = {
  details?: unknown;
  ok: false;
  reason: string;
};

export type SaaSCodexHostActionResult =
  | { ok: true }
  | SaaSCodexHostFailure;

/**
 * The workspace attribution the renderer gives the host so a folder import
 * lands in the caller's current workspace instead of the host's ambient one.
 *
 * This is a deliberate structural subset of the daemon/web
 * `WorkspaceCollabContext`, redeclared here rather than imported: this package
 * is the renderer host-bridge wire contract and must stay independent of the
 * daemon/web contracts package (enforced by the "stays independent from
 * daemon/web contracts" test). A full `WorkspaceCollabContext` is structurally
 * assignable to this type, so callers pass theirs unchanged.
 *
 * Only the fields the host actually forwards are modelled, and the enum-like
 * fields stay `string` because the host treats them as opaque pass-through
 * values — the daemon remains the authority that parses and validates them.
 * Deliberately no index signature: an interface never satisfies one, so adding
 * it would reject the very `WorkspaceCollabContext` callers pass. Callers hand
 * over a variable, not a fresh literal, so the extra fields ride along fine.
 */
export type SaaSCodexHostWorkspaceContext = {
  lifecycleState: string;
  memberStatus: string;
  permissions: {
    canShareProjects: boolean;
    canWriteSyncedFiles: boolean;
  };
  role: string;
  workspaceId: string;
  workspaceMemberId: string;
  workspaceType: string;
};

export type SaaSCodexHostProjectImportInit = {
  designSystemId?: string | null;
  name?: string;
  skillId?: string | null;
  workspaceContext?: SaaSCodexHostWorkspaceContext | null;
};

export type SaaSCodexHostProjectImportSuccess = {
  conversationId: string;
  entryFile: string | null;
  ok: true;
  projectId: string;
};

export type SaaSCodexHostProjectImportResult =
  | SaaSCodexHostProjectImportSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SaaSCodexHostFailure;

export type SaaSCodexHostProjectReplaceWorkingDirSuccess = {
  baseDir: string;
  entryFile: string | null;
  ok: true;
};

export type SaaSCodexHostProjectReplaceWorkingDirResult =
  | SaaSCodexHostProjectReplaceWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SaaSCodexHostFailure;

export type SaaSCodexHostPickWorkingDirSuccess = {
  baseDir: string;
  ok: true;
  // Single-use HMAC token (minted by the host main process for `baseDir`)
  // that the renderer threads into POST /api/projects/:id/working-dir once
  // the project exists. Lets the Home flow pick a folder before the project
  // is created without exposing the daemon's desktop-auth gate.
  token: string;
};

export type SaaSCodexHostPickWorkingDirResult =
  | SaaSCodexHostPickWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SaaSCodexHostFailure;

export type SaaSCodexHostPdfPrintOptions = {
  deck?: boolean;
};

export type SaaSCodexHostCaptureClip = { x: number; y: number; width: number; height: number };
export type SaaSCodexHostCaptureOptions = { clip?: SaaSCodexHostCaptureClip };
export type SaaSCodexHostCaptureSuccess = { dataUrl: string; h: number; ok: true; w: number };
export type SaaSCodexHostCaptureResult = SaaSCodexHostCaptureSuccess | SaaSCodexHostFailure;

export type SaaSCodexHostPreviewNavigationFailure = {
  errorCode: number;
  eventId: number;
  frameName?: string;
  occurredAtMs: number;
  validatedUrl: string;
};

export type SaaSCodexHostPreviewNavigationFailureListener = (
  failure: SaaSCodexHostPreviewNavigationFailure,
) => void;

export type SaaSCodexHostBrowserClearDataOptions = {
  cookies?: boolean;
  storage?: boolean;
};

/**
 * App theme values the renderer may pin the host window appearance to.
 * `light`/`dark` force the native window material (macOS under-window
 * vibrancy glass follows the OS appearance by default, which reads as a
 * muddy gray when the OS is dark but the app theme is explicitly light);
 * `system` restores following the OS.
 */
export const SAASCODEX_HOST_APPEARANCE_THEMES = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const);

export type SaaSCodexHostAppearanceTheme =
  (typeof SAASCODEX_HOST_APPEARANCE_THEMES)[keyof typeof SAASCODEX_HOST_APPEARANCE_THEMES];

export const SAASCODEX_HOST_UPDATER_ACTIONS = Object.freeze({
  CHECK: "check",
  CLEAR_CACHE: "clear-cache",
  DOWNLOAD: "download",
  INSTALL: "install",
  QUIT: "quit",
  STATUS: "status",
} as const);

export type SaaSCodexHostUpdaterAction =
  (typeof SAASCODEX_HOST_UPDATER_ACTIONS)[keyof typeof SAASCODEX_HOST_UPDATER_ACTIONS];

/** @internal Updater actions that return a status snapshot (every action except `quit`). */
export type SaaSCodexHostUpdaterStatusAction = Exclude<
  SaaSCodexHostUpdaterAction,
  typeof SAASCODEX_HOST_UPDATER_ACTIONS.QUIT
>;

export const SAASCODEX_HOST_UPDATER_STATES = Object.freeze({
  AVAILABLE: "available",
  CHECKING: "checking",
  DOWNLOADED: "downloaded",
  DOWNLOADING: "downloading",
  ERROR: "error",
  IDLE: "idle",
  INSTALLING: "installing",
  NOT_AVAILABLE: "not-available",
  UNSUPPORTED: "unsupported",
} as const);

export type SaaSCodexHostUpdaterState =
  (typeof SAASCODEX_HOST_UPDATER_STATES)[keyof typeof SAASCODEX_HOST_UPDATER_STATES];

export type SaaSCodexHostUpdaterMode = "js-incremental" | "package-launcher";
export type SaaSCodexHostUpdaterChannel = ReleaseChannel;

export type SaaSCodexHostUpdaterActionOptions = {
  payload?: Record<string, unknown>;
};

export type SaaSCodexHostUpdaterCapabilitySet = {
  canApplyInPlace: boolean;
  canDownload: boolean;
  canOpenInstaller: boolean;
  requiresManualInstall: boolean;
};

export type SaaSCodexHostUpdaterPathSnapshot = {
  downloadRoot?: string;
  manifestPath?: string;
};

export type SaaSCodexHostUpdaterChecksumSnapshot = {
  algorithm: "sha256" | "sha512";
  url?: string;
  value?: string;
};

export type SaaSCodexHostUpdaterArtifactSnapshot = {
  name?: string;
  platformKey?: string;
  size?: number;
  type?: string;
  url: string;
};

export type SaaSCodexHostUpdaterProgressSnapshot = {
  receivedBytes: number;
  totalBytes?: number;
};

export type SaaSCodexHostUpdaterErrorSnapshot = {
  code: string;
  details?: unknown;
  message: string;
};

export type SaaSCodexHostUpdaterInstallResult = {
  activeVersion?: string;
  artifactPath?: string;
  dryRun?: boolean;
  helperLogPath?: string;
  launcherRuntimePath?: string;
  launchPath?: string;
  openedAt: string;
  path: string;
};

export type SaaSCodexHostUpdaterReleaseSnapshot = {
  arch: string;
  artifact: SaaSCodexHostUpdaterArtifactSnapshot;
  checksum: SaaSCodexHostUpdaterChecksumSnapshot;
  channel: SaaSCodexHostUpdaterChannel;
  downloadedAt: string;
  key: string;
  metadata?: Record<string, unknown>;
  path: string;
  platformKey: string;
  version: string;
};

export type SaaSCodexHostUpdaterIncomingSnapshot = {
  arch: string;
  artifact: SaaSCodexHostUpdaterArtifactSnapshot;
  channel: SaaSCodexHostUpdaterChannel;
  key?: string;
  metadata?: Record<string, unknown>;
  progress?: SaaSCodexHostUpdaterProgressSnapshot;
  startedAt: string;
  version: string;
};

export type SaaSCodexHostUpdaterCacheLifecycleTrigger = "cold-start" | "manual" | "next-version-ready";

export type SaaSCodexHostUpdaterReleaseLifecycleState =
  | "cleanup-deferred"
  | "cleanup-removed"
  | "deprecated"
  | "retained"
  | "unknown";

export type SaaSCodexHostUpdaterCacheLifecycleSummary = {
  lastRunAt?: string;
  lastTrigger?: SaaSCodexHostUpdaterCacheLifecycleTrigger;
  platform: string;
  releases: {
    cleanupDeferred: number;
    cleanupRemoved: number;
    deprecated: number;
    errors: number;
    retained: number;
    total: number;
    unknown: number;
  };
};

export type SaaSCodexHostUpdaterCacheSnapshot = {
  lifecycle?: SaaSCodexHostUpdaterCacheLifecycleSummary;
};

export type SaaSCodexHostUpdaterReinstallReason =
  | "launcher-schema"
  | "outer-below-min"
  | "outer-version-unreadable";

/**
 * Present when the release feed requires a full installer reinstall instead of
 * an in-place payload update. `installedVersion` is the physically installed
 * outer package version; `url` is an optional operator-supplied explanation
 * link.
 */
export type SaaSCodexHostUpdaterReinstallSnapshot = {
  installedVersion?: string;
  minVersion?: string;
  reason: SaaSCodexHostUpdaterReinstallReason;
  url?: string;
};

export type SaaSCodexHostUpdaterStatusSnapshot = {
  active?: SaaSCodexHostUpdaterReleaseSnapshot;
  arch: string;
  artifact?: SaaSCodexHostUpdaterArtifactSnapshot;
  artifactUrl?: string;
  availableVersion?: string;
  cache?: SaaSCodexHostUpdaterCacheSnapshot;
  capabilities: SaaSCodexHostUpdaterCapabilitySet;
  channel: SaaSCodexHostUpdaterChannel;
  checksum?: SaaSCodexHostUpdaterChecksumSnapshot;
  currentVersion: string;
  downloadPath?: string;
  enabled: boolean;
  error?: SaaSCodexHostUpdaterErrorSnapshot;
  incoming?: SaaSCodexHostUpdaterIncomingSnapshot;
  installResult?: SaaSCodexHostUpdaterInstallResult;
  lastCheckedAt?: string;
  metadata?: Record<string, unknown>;
  mode: SaaSCodexHostUpdaterMode;
  paths?: SaaSCodexHostUpdaterPathSnapshot;
  platform: string;
  progress?: SaaSCodexHostUpdaterProgressSnapshot;
  reinstall?: SaaSCodexHostUpdaterReinstallSnapshot;
  state: SaaSCodexHostUpdaterState;
  supported: boolean;
};

export type SaaSCodexHostUpdaterResult =
  | { ok: true; status: SaaSCodexHostUpdaterStatusSnapshot }
  | SaaSCodexHostFailure;

export type SaaSCodexHostUpdaterStatusListener = (status: SaaSCodexHostUpdaterStatusSnapshot) => void;

export type SaaSCodexHostUpdaterMenuLabels = {
  check: string;
  checking: string;
  downloading: string;
  install: string;
  installing: string;
  restart: string;
};

export type SaaSCodexHostUpdaterOpenDialogRequest = {
  source: string;
};

export type SaaSCodexHostUpdaterOpenDialogListener = (request: SaaSCodexHostUpdaterOpenDialogRequest) => void;

export type SaaSCodexHostBridge = {
  // Optional so older host builds still satisfy the bridge shape; callers
  // must feature-detect before invoking.
  appearance?: {
    setTheme(theme: SaaSCodexHostAppearanceTheme): void;
  };
  browser: {
    clearData(options?: SaaSCodexHostBrowserClearDataOptions): Promise<SaaSCodexHostActionResult>;
  };
  capture: {
    page(options?: SaaSCodexHostCaptureOptions): Promise<SaaSCodexHostCaptureResult>;
  };
  client: SaaSCodexHostClient;
  pdf: {
    print(html: string, nonce?: string, options?: SaaSCodexHostPdfPrintOptions): Promise<SaaSCodexHostActionResult>;
  };
  pet: {
    setVisible(visible: boolean): void;
  };
  // Optional so web builds and older desktop hosts keep the same contract.
  // Electron is the only layer that can observe a compositor-affecting
  // subframe navigation failure after the iframe DOM remains healthy.
  preview?: {
    getLatestNavigationFailure(): SaaSCodexHostPreviewNavigationFailure | null;
    subscribeNavigationFailure(listener: SaaSCodexHostPreviewNavigationFailureListener): () => void;
  };
  project: {
    pickAndImport(init?: SaaSCodexHostProjectImportInit): Promise<SaaSCodexHostProjectImportResult>;
    pickAndReplaceWorkingDir(projectId: string): Promise<SaaSCodexHostProjectReplaceWorkingDirResult>;
    // Optional so older host builds still satisfy the bridge shape; callers
    // must feature-detect before invoking.
    pickWorkingDir?(): Promise<SaaSCodexHostPickWorkingDirResult>;
  };
  shell: {
    openExternal(url: string): Promise<SaaSCodexHostActionResult>;
    openPath(projectId: string): Promise<SaaSCodexHostActionResult>;
  };
  // Desktop only. Absent in Web and old clients; callers must fail closed.
  updater: {
    check(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostUpdaterStatusSnapshot>;
    "clear-cache"(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostUpdaterStatusSnapshot>;
    download(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostUpdaterStatusSnapshot>;
    install(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostUpdaterStatusSnapshot>;
    quit(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostActionResult>;
    setMenuLabels(labels: SaaSCodexHostUpdaterMenuLabels): Promise<SaaSCodexHostActionResult>;
    status(options?: SaaSCodexHostUpdaterActionOptions): Promise<SaaSCodexHostUpdaterStatusSnapshot>;
    subscribe(listener: SaaSCodexHostUpdaterStatusListener): () => void;
    subscribeOpenDialog(listener: SaaSCodexHostUpdaterOpenDialogListener): () => void;
  };
  version: typeof SAASCODEX_HOST_VERSION;
};

export type SaaSCodexHostGlobalScope = Record<string, unknown> & {
  window?: unknown;
};
