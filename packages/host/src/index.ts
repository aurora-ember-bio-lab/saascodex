/**
 * @module host
 *
 * Public barrel for `@saascodex/host` — the SaaSCodex renderer host-bridge
 * protocol. Re-exports the exact prior flat surface from the cohesive sibling
 * modules: the wire protocol (constants + types), bridge detection/validation,
 * adapter-result normalizers, and the renderer-facing action wrappers. This
 * file contains no logic.
 */

// --- protocol: constant registries + wire types ---
export {
  SAASCODEX_HOST_GLOBAL,
  SAASCODEX_HOST_VERSION,
  SAASCODEX_HOST_APPEARANCE_THEMES,
  SAASCODEX_HOST_CLIENT_TYPES,
  SAASCODEX_HOST_UPDATER_ACTIONS,
  SAASCODEX_HOST_UPDATER_STATES,
} from "./protocol.js";
export type {
  SaaSCodexHostClientType,
  SaaSCodexHostClient,
  SaaSCodexHostFailure,
  SaaSCodexHostActionResult,
  SaaSCodexHostWorkspaceContext,
  SaaSCodexHostProjectImportInit,
  SaaSCodexHostProjectImportSuccess,
  SaaSCodexHostProjectImportResult,
  SaaSCodexHostProjectReplaceWorkingDirSuccess,
  SaaSCodexHostProjectReplaceWorkingDirResult,
  SaaSCodexHostPickWorkingDirSuccess,
  SaaSCodexHostPickWorkingDirResult,
  SaaSCodexHostPdfPrintOptions,
  SaaSCodexHostCaptureClip,
  SaaSCodexHostCaptureOptions,
  SaaSCodexHostCaptureSuccess,
  SaaSCodexHostCaptureResult,
  SaaSCodexHostPreviewNavigationFailure,
  SaaSCodexHostPreviewNavigationFailureListener,
  SaaSCodexHostAppearanceTheme,
  SaaSCodexHostBrowserClearDataOptions,
  SaaSCodexHostUpdaterAction,
  SaaSCodexHostUpdaterState,
  SaaSCodexHostUpdaterMode,
  SaaSCodexHostUpdaterChannel,
  SaaSCodexHostUpdaterActionOptions,
  SaaSCodexHostUpdaterCapabilitySet,
  SaaSCodexHostUpdaterPathSnapshot,
  SaaSCodexHostUpdaterChecksumSnapshot,
  SaaSCodexHostUpdaterArtifactSnapshot,
  SaaSCodexHostUpdaterProgressSnapshot,
  SaaSCodexHostUpdaterErrorSnapshot,
  SaaSCodexHostUpdaterInstallResult,
  SaaSCodexHostUpdaterReleaseSnapshot,
  SaaSCodexHostUpdaterIncomingSnapshot,
  SaaSCodexHostUpdaterCacheLifecycleTrigger,
  SaaSCodexHostUpdaterReleaseLifecycleState,
  SaaSCodexHostUpdaterCacheLifecycleSummary,
  SaaSCodexHostUpdaterCacheSnapshot,
  SaaSCodexHostUpdaterReinstallReason,
  SaaSCodexHostUpdaterReinstallSnapshot,
  SaaSCodexHostUpdaterStatusSnapshot,
  SaaSCodexHostUpdaterResult,
  SaaSCodexHostUpdaterStatusListener,
  SaaSCodexHostUpdaterMenuLabels,
  SaaSCodexHostUpdaterOpenDialogRequest,
  SaaSCodexHostUpdaterOpenDialogListener,
  SaaSCodexHostBridge,
  SaaSCodexHostGlobalScope,
} from "./protocol.js";

// --- detection: locate + validate the injected bridge ---
export {
  isSaaSCodexHostBridge,
  getSaaSCodexHost,
  isSaaSCodexHostAvailable,
  detectSaaSCodexHostClientType,
} from "./detection.js";

// --- normalize: adapter result -> renderer contract ---
export {
  normalizeSaaSCodexHostProjectImportResult,
  normalizeSaaSCodexHostProjectReplaceWorkingDirResult,
  normalizeSaaSCodexHostPickWorkingDirResult,
} from "./normalize.js";

// --- actions: renderer-facing host action wrappers ---
export {
  openHostExternalUrl,
  openHostProjectPath,
  clearHostBrowserData,
  captureHostPage,
  pickAndImportHostProject,
  pickAndReplaceHostProjectWorkingDir,
  pickHostWorkingDir,
  printHostPdf,
  setHostPetVisible,
  getHostUpdaterStatus,
  checkHostUpdater,
  clearHostUpdaterCache,
  downloadHostUpdater,
  installHostUpdater,
  quitHostAfterUpdaterInstallerOpen,
  getLatestHostPreviewNavigationFailure,
  subscribeHostUpdater,
  subscribeHostUpdaterOpenDialog,
  subscribeHostPreviewNavigationFailure,
  setHostUpdaterMenuLabels,
} from "./actions.js";
