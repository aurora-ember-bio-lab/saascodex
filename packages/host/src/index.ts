/**
 * @module host
 *
 * Public barrel for `@splatstudio/host` — the SplatStudio renderer host-bridge
 * protocol. Re-exports the exact prior flat surface from the cohesive sibling
 * modules: the wire protocol (constants + types), bridge detection/validation,
 * adapter-result normalizers, and the renderer-facing action wrappers. This
 * file contains no logic.
 */

// --- protocol: constant registries + wire types ---
export {
  SPLATSTUDIO_HOST_GLOBAL,
  SPLATSTUDIO_HOST_VERSION,
  SPLATSTUDIO_HOST_APPEARANCE_THEMES,
  SPLATSTUDIO_HOST_CLIENT_TYPES,
  SPLATSTUDIO_HOST_UPDATER_ACTIONS,
  SPLATSTUDIO_HOST_UPDATER_STATES,
} from "./protocol.js";
export type {
  SplatStudioHostClientType,
  SplatStudioHostClient,
  SplatStudioHostFailure,
  SplatStudioHostActionResult,
  SplatStudioHostWorkspaceContext,
  SplatStudioHostProjectImportInit,
  SplatStudioHostProjectImportSuccess,
  SplatStudioHostProjectImportResult,
  SplatStudioHostProjectReplaceWorkingDirSuccess,
  SplatStudioHostProjectReplaceWorkingDirResult,
  SplatStudioHostPickWorkingDirSuccess,
  SplatStudioHostPickWorkingDirResult,
  SplatStudioHostPdfPrintOptions,
  SplatStudioHostCaptureClip,
  SplatStudioHostCaptureOptions,
  SplatStudioHostCaptureSuccess,
  SplatStudioHostCaptureResult,
  SplatStudioHostPreviewNavigationFailure,
  SplatStudioHostPreviewNavigationFailureListener,
  SplatStudioHostAppearanceTheme,
  SplatStudioHostBrowserClearDataOptions,
  SplatStudioHostUpdaterAction,
  SplatStudioHostUpdaterState,
  SplatStudioHostUpdaterMode,
  SplatStudioHostUpdaterChannel,
  SplatStudioHostUpdaterActionOptions,
  SplatStudioHostUpdaterCapabilitySet,
  SplatStudioHostUpdaterPathSnapshot,
  SplatStudioHostUpdaterChecksumSnapshot,
  SplatStudioHostUpdaterArtifactSnapshot,
  SplatStudioHostUpdaterProgressSnapshot,
  SplatStudioHostUpdaterErrorSnapshot,
  SplatStudioHostUpdaterInstallResult,
  SplatStudioHostUpdaterReleaseSnapshot,
  SplatStudioHostUpdaterIncomingSnapshot,
  SplatStudioHostUpdaterCacheLifecycleTrigger,
  SplatStudioHostUpdaterReleaseLifecycleState,
  SplatStudioHostUpdaterCacheLifecycleSummary,
  SplatStudioHostUpdaterCacheSnapshot,
  SplatStudioHostUpdaterReinstallReason,
  SplatStudioHostUpdaterReinstallSnapshot,
  SplatStudioHostUpdaterStatusSnapshot,
  SplatStudioHostUpdaterResult,
  SplatStudioHostUpdaterStatusListener,
  SplatStudioHostUpdaterMenuLabels,
  SplatStudioHostUpdaterOpenDialogRequest,
  SplatStudioHostUpdaterOpenDialogListener,
  SplatStudioHostBridge,
  SplatStudioHostGlobalScope,
} from "./protocol.js";

// --- detection: locate + validate the injected bridge ---
export {
  isSplatStudioHostBridge,
  getSplatStudioHost,
  isSplatStudioHostAvailable,
  detectSplatStudioHostClientType,
} from "./detection.js";

// --- normalize: adapter result -> renderer contract ---
export {
  normalizeSplatStudioHostProjectImportResult,
  normalizeSplatStudioHostProjectReplaceWorkingDirResult,
  normalizeSplatStudioHostPickWorkingDirResult,
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
