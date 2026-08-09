export type LocalRuntimeCapabilities = {
  indexedDb: boolean;
  serviceWorker: boolean;
  webWorkers: boolean;
  webAssembly: boolean;
  webGpu: boolean;
  mediaRecorder: boolean;
  audioWorklet: boolean;
  fileSystemAccess: boolean;
  storageEstimate?: { usage: number; quota: number };
};

export async function detectLocalRuntime(): Promise<LocalRuntimeCapabilities> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const win = typeof window !== "undefined" ? window : undefined;
  let storageEstimate: LocalRuntimeCapabilities["storageEstimate"];

  if (nav?.storage?.estimate) {
    try {
      const estimate = await nav.storage.estimate();
      if (typeof estimate.usage === "number" && typeof estimate.quota === "number") {
        storageEstimate = { usage: estimate.usage, quota: estimate.quota };
      }
    } catch {
      // Capability detection must never prevent the Studio from loading.
    }
  }

  return {
    indexedDb: typeof indexedDB !== "undefined",
    serviceWorker: Boolean(nav?.serviceWorker),
    webWorkers: typeof Worker !== "undefined',
    webAssembly: typeof WebAssembly !== "undefined',
    webGpu: Boolean(nav && "gpu" in nav),
    mediaRecorder: typeof win?.MediaRecorder !== "undefined',
    audioWorklet: typeof AudioWorkletNode !== "undefined',
    fileSystemAccess: Boolean(win && "showOpenFilePicker" in win),
    storageEstimate,
  };
}

export function isAndroidLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function localRuntimeSummary(capabilities: LocalRuntimeCapabilities): string {
  if (capabilities.webGpu) return "Phone GPU acceleration available";
  if (capabilities.webAssembly) return "Local WASM processing available";
  return "Local browser processing available";
}
