import { BUDDY_VOICES, findSpeechVoice } from "./buddy-voices";
import { getLocalBuddyClone, isUsableLocalClone } from "./buddy-local-clone";

export type BuddyEngineId = "browser" | "kokoro" | "qwen3-tts" | "chatterbox-onnx" | "local-model";

export type BuddyEngine = {
  id: BuddyEngineId;
  name: string;
  local: true;
  cloning: boolean;
  multilingual: boolean;
  minimumMemoryGb?: number;
};

export const BUDDY_ENGINES: BuddyEngine[] = [
  { id: "browser", name: "Phone voice", local: true, cloning: false, multilingual: true },
  {
    id: "kokoro",
    name: "Kokoro 82M",
    local: true,
    cloning: false,
    multilingual: true,
    minimumMemoryGb: 2,
  },
  {
    id: "chatterbox-onnx",
    name: "Chatterbox Multilingual ONNX",
    local: true,
    cloning: true,
    multilingual: true,
    minimumMemoryGb: 4,
  },
  {
    id: "qwen3-tts",
    name: "Qwen3-TTS 0.6B",
    local: true,
    cloning: true,
    multilingual: true,
    minimumMemoryGb: 6,
  },
  {
    id: "local-model",
    name: "Installed Buddy model",
    local: true,
    cloning: true,
    multilingual: true,
  },
];

export function detectBuddyHardware() {
  if (typeof navigator === "undefined")
    return { webGpu: false, wasm: false, memoryGb: undefined as number | undefined };
  const nav = navigator as Navigator & { deviceMemory?: number; gpu?: unknown };
  return {
    webGpu: Boolean(nav.gpu),
    wasm: typeof WebAssembly !== "undefined",
    memoryGb: nav.deviceMemory,
  };
}

export function chooseBuddyEngine(preferClone = false): BuddyEngine {
  const hardware = detectBuddyHardware();
  const installed = getLocalBuddyClone();
  if (isUsableLocalClone(installed)) return BUDDY_ENGINES.find((e) => e.id === "local-model")!;
  if (preferClone && (hardware.memoryGb ?? 8) >= 6 && hardware.webGpu)
    return BUDDY_ENGINES.find((e) => e.id === "qwen3-tts")!;
  if (preferClone && (hardware.memoryGb ?? 8) >= 4)
    return BUDDY_ENGINES.find((e) => e.id === "chatterbox-onnx")!;
  if (hardware.webGpu || hardware.wasm) return BUDDY_ENGINES.find((e) => e.id === "kokoro")!;
  return BUDDY_ENGINES.find((e) => e.id === "browser")!;
}

export function speakBuddyLocally(
  text: string,
  voiceId = "browser-en-us",
  preferClone = false,
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const selected = BUDDY_VOICES.find((voice) => voice.id === voiceId) ?? BUDDY_VOICES[0];
  if (selected.kind === "cloned") return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selected.locale;
  utterance.rate = 1;
  utterance.pitch = 1;
  const voice = findSpeechVoice(selected.locale);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  void preferClone;
  return true;
}
