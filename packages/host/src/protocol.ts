import type { ReleaseChannel } from "@splatstudio/release";

/**
 * @module protocol
 *
 * The SplatStudio renderer host-bridge wire contract: the injected-global name
 * and version, client/updater constant registries, and every request/result
 * type that crosses the host bridge — including the {@link SplatStudioHostBridge}
 * shape itself. Pure declarations only; depends on nothing else in the package.
 */

export const SPLATSTUDIO_HOST_GLOBAL = "__od__";
export const SPLATSTUDIO_HOST_VERSION = 2;

export const SPLATSTUDIO_HOST_CLIENT_TYPES = Object.freeze({
  DESKTOP: "desktop",
} as const);

export type SplatStudioHostClientType =
  (typeof SPLATSTUDIO_HOST_CLIENT_TYPES)[keyof typeof SPLATSTUDIO_HOST_CLIENT_TYPES];

export type SplatStudioHostClient = {
  // BCP-47 locale string (e.g. "zh-CN", "pt-BR") the host process read from
  // the OS at startup. The renderer uses this so the packaged desktop app
  // can follow the OS language even when Chromium's built-in
  // `navigator.language` would have defaulted to en-US.
  osLocale?: string;
  platform?: string;
  type: SplatStudioHostClientType;
};

export type SplatStudioHostFailure = {
  details?: unknown;
  ok: false;
  reason: string;
};

export type SplatStudioHostActionResult =
  | { ok: true }
  | SplatStudioHostFailure;

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
export type SplatStudioHostWorkspaceContext = {
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

export type SplatStudioHostProjectImportInit = {
  designSystemId?: string | null;
  name?: string;
  skillId?: string | null;
  workspaceContext?: SplatStudioHostWorkspaceContext | null;
};

export type SplatStudioHostProjectImportSuccess = {
  conversationId: string;
  entryFile: string | null;
  ok: true;
  projectId: string;
};

export type SplatStudioHostProjectImportResult =
  | SplatStudioHostProjectImportSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SplatStudioHostFailure;

export type SplatStudioHostProjectReplaceWorkingDirSuccess = {
  baseDir: string;
  entryFile: string | null;
  ok: true;
};

export type SplatStudioHostProjectReplaceWorkingDirResult =
  | SplatStudioHostProjectReplaceWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SplatStudioHostFailure;

export type SplatStudioHostPickWorkingDirSuccess = {
  baseDir: string;
  ok: true;
  // Single-use HMAC token (minted by the host main process for `baseDir`)
  // that the renderer threads into POST /api/projects/:id/working-dir once
  // the project exists. Lets the Home flow pick a folder before the project
  // is created without exposing the daemon's desktop-auth gate.
  token: string;
};

export type SplatStudioHostPickWorkingDirResult =
  | SplatStudioHostPickWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | SplatStudioHostFailure;

export type SplatStudioHostPdfPrintOptions = {
  deck?: boolean;
};

export type SplatStudioHostCaptureClip = { x: number; y: number; width: number; height: number };
export type SplatStudioHostCaptureOptions = { clip?: SplatStudioHostCaptureClip };
export type SplatStudioHostCaptureSuccess = { dataUrl: string; h: number; ok: true; w: number };
export type SplatStudioHostCaptureResult = SplatStudioHostCaptureSuccess | SplatStudioHostFailure;

export type SplatStudioHostPreviewNavigationFailure = {
  errorCode: number;
  eventId: number;
  frameName?: string;
  occurredAtMs: number;
  validatedUrl: string;
};

export type SplatStudioHostPreviewNavigationFailureListener = (
  failure: SplatStudioHostPreviewNavigationFailure,
) => void;

export type SplatStudioHostBrowserClearDataOptions = {
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
export const SPLATSTUDIO_HOST_APPEARANCE_THEMES = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const);

export type SplatStudioHostAppearanceTheme =
  (typeof SPLATSTUDIO_HOST_APPEARANCE_THEMES)[keyof typeof SPLATSTUDIO_HOST_APPEARANCE_THEMES];

export const SPLATSTUDIO_HOST_UPDATER_ACTIONS = Object.freeze({
  CHECK: "check",
  CLEAR_CACHE: "clear-cache",
  DOWNLOAD: "download",
  INSTALL: "install",
  QUIT: "quit",
  STATUS: "status",
} as const);

export type SplatStudioHostUpdaterAction =
  (typeof SPLATSTUDIO_HOST_UPDATER_ACTIONS)[keyof typeof SPLATSTUDIO_HOST_UPDATER_ACTIONS];

/** @internal Updater actions that return a status snapshot (every action except `quit`). */
export type SplatStudioHostUpdaterStatusAction = Exclude<
  SplatStudioHostUpdaterAction,
  typeof SPLATSTUDIO_HOST_UPDATER_ACTIONS.QUIT
>;

export const SPLATSTUDIO_HOST_UPDATER_STATES = Object.freeze({
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

export type SplatStudioHostUpdaterState =
  (typeof SPLATSTUDIO_HOST_UPDATER_STATES)[keyof typeof SPLATSTUDIO_HOST_UPDATER_STATES];

export type SplatStudioHostUpdaterMode = "js-incremental" | "package-launcher";
export type SplatStudioHostUpdaterChannel = ReleaseChannel;

export type SplatStudioHostUpdaterActionOptions = {
  payload?: Record<string, unknown>;
};

export type SplatStudioHostUpdaterCapabilitySet = {
  canApplyInPlace: boolean;
  canDownload: boolean;
  canOpenInstaller: boolean;
  requiresManualInstall: boolean;
};

export type SplatStudioHostUpdaterPathSnapshot = {
  downloadRoot?: string;
  manifestPath?: string;
};

export type SplatStudioHostUpdaterChecksumSnapshot = {
  algorithm: "sha256" | "sha512";
  url?: string;
  value?: string;
};

export type SplatStudioHostUpdaterArtifactSnapshot = {
  name?: string;
  platformKey?: string;
  size?: number;
  type?: string;
  url: string;
};

export type SplatStudioHostUpdaterProgressSnapshot = {
  receivedBytes: number;
  totalBytes?: number;
};

export type SplatStudioHostUpdaterErrorSnapshot = {
  code: string;
  details?: unknown;
  message: string;
};

export type SplatStudioHostUpdaterInstallResult = {
  activeVersion?: string;
  artifactPath?: string;
  dryRun?: boolean;
  helperLogPath?: string;
  launcherRuntimePath?: string;
  launchPath?: string;
  openedAt: string;
  path: string;
};

export type SplatStudioHostUpdaterReleaseSnapshot = {
  arch: string;
  artifact: SplatStudioHostUpdaterArtifactSnapshot;
  checksum: SplatStudioHostUpdaterChecksumSnapshot;
  channel: SplatStudioHostUpdaterChannel;
  downloadedAt: string;
  key: string;
  metadata?: Record<string, unknown>;
  path: string;
  platformKey: string;
  version: string;
};

export type SplatStudioHostUpdaterIncomingSnapshot = {
  arch: string;
  artifact: SplatStudioHostUpdaterArtifactSnapshot;
  channel: SplatStudioHostUpdaterChannel;
  key?: string;
  metadata?: Record<string, unknown>;
  progress?: SplatStudioHostUpdaterProgressSnapshot;
  startedAt: string;
  version: string;
};

export type SplatStudioHostUpdaterCacheLifecycleTrigger = "cold-start" | "manual" | "next-version-ready";

export type SplatStudioHostUpdaterReleaseLifecycleState =
  | "cleanup-deferred"
  | "cleanup-removed"
  | "deprecated"
  | "retained"
  | "unknown";

export type SplatStudioHostUpdaterCacheLifecycleSummary = {
  lastRunAt?: string;
  lastTrigger?: SplatStudioHostUpdaterCacheLifecycleTrigger;
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

export type SplatStudioHostUpdaterCacheSnapshot = {
  lifecycle?: SplatStudioHostUpdaterCacheLifecycleSummary;
};

export type SplatStudioHostUpdaterReinstallReason =
  | "launcher-schema"
  | "outer-below-min"
  | "outer-version-unreadable";

/**
 * Present when the release feed requires a full installer reinstall instead of
 * an in-place payload update. `installedVersion` is the physically installed
 * outer package version; `url` is an optional operator-supplied explanation
 * link.
 */
export type SplatStudioHostUpdaterReinstallSnapshot = {
  installedVersion?: string;
  minVersion?: string;
  reason: SplatStudioHostUpdaterReinstallReason;
  url?: string;
};

export type SplatStudioHostUpdaterStatusSnapshot = {
  active?: SplatStudioHostUpdaterReleaseSnapshot;
  arch: string;
  artifact?: SplatStudioHostUpdaterArtifactSnapshot;
  artifactUrl?: string;
  availableVersion?: string;
  cache?: SplatStudioHostUpdaterCacheSnapshot;
  capabilities: SplatStudioHostUpdaterCapabilitySet;
  channel: SplatStudioHostUpdaterChannel;
  checksum?: SplatStudioHostUpdaterChecksumSnapshot;
  currentVersion: string;
  downloadPath?: string;
  enabled: boolean;
  error?: SplatStudioHostUpdaterErrorSnapshot;
  incoming?: SplatStudioHostUpdaterIncomingSnapshot;
  installResult?: SplatStudioHostUpdaterInstallResult;
  lastCheckedAt?: string;
  metadata?: Record<string, unknown>;
  mode: SplatStudioHostUpdaterMode;
  paths?: SplatStudioHostUpdaterPathSnapshot;
  platform: string;
  progress?: SplatStudioHostUpdaterProgressSnapshot;
  reinstall?: SplatStudioHostUpdaterReinstallSnapshot;
  state: SplatStudioHostUpdaterState;
  supported: boolean;
};

export type SplatStudioHostUpdaterResult =
  | { ok: true; status: SplatStudioHostUpdaterStatusSnapshot }
  | SplatStudioHostFailure;

export type SplatStudioHostUpdaterStatusListener = (status: SplatStudioHostUpdaterStatusSnapshot) => void;

export type SplatStudioHostUpdaterMenuLabels = {
  check: string;
  checking: string;
  downloading: string;
  install: string;
  installing: string;
  restart: string;
};

export type SplatStudioHostUpdaterOpenDialogRequest = {
  source: string;
};

export type SplatStudioHostUpdaterOpenDialogListener = (request: SplatStudioHostUpdaterOpenDialogRequest) => void;

export type SplatStudioHostBridge = {
  // Optional so older host builds still satisfy the bridge shape; callers
  // must feature-detect before invoking.
  appearance?: {
    setTheme(theme: SplatStudioHostAppearanceTheme): void;
  };
  browser: {
    clearData(options?: SplatStudioHostBrowserClearDataOptions): Promise<SplatStudioHostActionResult>;
  };
  capture: {
    page(options?: SplatStudioHostCaptureOptions): Promise<SplatStudioHostCaptureResult>;
  };
  client: SplatStudioHostClient;
  pdf: {
    print(html: string, nonce?: string, options?: SplatStudioHostPdfPrintOptions): Promise<SplatStudioHostActionResult>;
  };
  pet: {
    setVisible(visible: boolean): void;
  };
  // Optional so web builds and older desktop hosts keep the same contract.
  // Electron is the only layer that can observe a compositor-affecting
  // subframe navigation failure after the iframe DOM remains healthy.
  preview?: {
    getLatestNavigationFailure(): SplatStudioHostPreviewNavigationFailure | null;
    subscribeNavigationFailure(listener: SplatStudioHostPreviewNavigationFailureListener): () => void;
  };
  project: {
    pickAndImport(init?: SplatStudioHostProjectImportInit): Promise<SplatStudioHostProjectImportResult>;
    pickAndReplaceWorkingDir(projectId: string): Promise<SplatStudioHostProjectReplaceWorkingDirResult>;
    // Optional so older host builds still satisfy the bridge shape; callers
    // must feature-detect before invoking.
    pickWorkingDir?(): Promise<SplatStudioHostPickWorkingDirResult>;
  };
  shell: {
    openExternal(url: string): Promise<SplatStudioHostActionResult>;
    openPath(projectId: string): Promise<SplatStudioHostActionResult>;
  };
  // Desktop only. Absent in Web and old clients; callers must fail closed.
  updater: {
    check(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostUpdaterStatusSnapshot>;
    "clear-cache"(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostUpdaterStatusSnapshot>;
    download(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostUpdaterStatusSnapshot>;
    install(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostUpdaterStatusSnapshot>;
    quit(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostActionResult>;
    setMenuLabels(labels: SplatStudioHostUpdaterMenuLabels): Promise<SplatStudioHostActionResult>;
    status(options?: SplatStudioHostUpdaterActionOptions): Promise<SplatStudioHostUpdaterStatusSnapshot>;
    subscribe(listener: SplatStudioHostUpdaterStatusListener): () => void;
    subscribeOpenDialog(listener: SplatStudioHostUpdaterOpenDialogListener): () => void;
  };
  version: typeof SPLATSTUDIO_HOST_VERSION;
};

export type SplatStudioHostGlobalScope = Record<string, unknown> & {
  window?: unknown;
};
