// Browser capability registry. A browser capability is NOT itself an AI model.
// Buddy only calls something "local" when the Studio has a real local implementation
// for that task. WebGPU/WASM availability alone never counts as a generative engine.

export type LocalCapability =
  "indexeddb" | "wasm" | "workers" | "webgpu" | "recording" | "audioworklet" | "file-access";

export type EngineReadiness = {
  id: string;
  label: string;
  capability: LocalCapability;
  available: boolean;
  hasLocalModel: boolean;
  freeRunner?: string;
  requiresApiKey: false;
};

// These describe what the phone/browser can provide to the Studio itself.
// Heavy generative models remain free/open runner jobs unless a real local
// model implementation is installed and detected.
export const LOCAL_ENGINES: EngineReadiness[] = [
  {
    id: "storage",
    label: "Project storage",
    capability: "indexeddb",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "audio-processing",
    label: "Browser audio processing",
    capability: "wasm",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "background-processing",
    label: "Background processing",
    capability: "workers",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "phone-gpu",
    label: "Phone GPU capability",
    capability: "webgpu",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "recording",
    label: "Local recording",
    capability: "recording",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "audio-worklet",
    label: "Real-time audio processing",
    capability: "audioworklet",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
  {
    id: "file-access",
    label: "Direct file access",
    capability: "file-access",
    available: false,
    hasLocalModel: false,
    requiresApiKey: false,
  },
];

export function capabilityAvailable(capability: LocalCapability): boolean {
  if (typeof window === "undefined") return false;
  switch (capability) {
    case "indexeddb":
      return "indexedDB" in window;
    case "wasm":
      return typeof WebAssembly !== "undefined";
    case "workers":
      return typeof Worker !== "undefined";
    case "webgpu":
      return "gpu" in navigator;
    case "recording":
      return !!navigator.mediaDevices?.getUserMedia;
    case "audioworklet":
      return typeof AudioWorkletNode !== "undefined";
    case "file-access":
      return "showOpenFilePicker" in window;
    default:
      return false;
  }
}

export function getEngineReadiness(): EngineReadiness[] {
  return LOCAL_ENGINES.map((engine) => ({
    ...engine,
    available: capabilityAvailable(engine.capability),
  }));
}
