// Local-first engine capability registry.
// Keep this module dependency-free so the Studio can determine which
// browser capabilities are available before choosing a free/open runner.

export type LocalCapability =
  | 'indexeddb'
  | 'wasm'
  | 'workers'
  | 'webgpu'
  | 'recording'
  | 'audioworklet'
  | 'file-access';

export type EngineReadiness = {
  id: string;
  label: string;
  capability: LocalCapability;
  local: boolean;
  freeRunner?: string;
  requiresApiKey: false;
};

export const LOCAL_ENGINES: EngineReadiness[] = [
  { id: 'writing-local', label: 'Writing & Council', capability: 'wasm', local: true, requiresApiKey: false },
  { id: 'voice-local', label: 'Voice', capability: 'wasm', local: true, freeRunner: 'ApplioX', requiresApiKey: false },
  { id: 'music-local', label: 'Music', capability: 'webgpu', local: true, freeRunner: 'ACE-Step 1.5', requiresApiKey: false },
  { id: 'stems-local', label: 'Stem separation', capability: 'wasm', local: true, freeRunner: 'Demucs', requiresApiKey: false },
  { id: 'art-local', label: 'Artwork', capability: 'webgpu', local: true, freeRunner: 'SDXL', requiresApiKey: false },
  { id: 'video-local', label: 'Video', capability: 'webgpu', local: true, freeRunner: 'Wan 2.2', requiresApiKey: false },
];

export function capabilityAvailable(capability: LocalCapability): boolean {
  if (typeof window === 'undefined') return false;
  switch (capability) {
    case 'indexeddb': return 'indexedDB' in window;
    case 'wasm': return typeof WebAssembly !== 'undefined';
    case 'workers': return typeof Worker !== 'undefined';
    case 'webgpu': return 'gpu' in navigator;
    case 'recording': return !!navigator.mediaDevices?.getUserMedia;
    case 'audioworklet': return typeof AudioWorkletNode !== 'undefined';
    case 'file-access': return 'showOpenFilePicker' in window;
    default: return false;
  }
}

export function getEngineReadiness(): EngineReadiness[] {
  return LOCAL_ENGINES.map((engine) => ({
    ...engine,
    local: capabilityAvailable(engine.capability),
  }));
}

export function getBestRoute(engine: EngineReadiness): 'local' | 'free-runner' {
  return engine.local ? 'local' : 'free-runner';
}
