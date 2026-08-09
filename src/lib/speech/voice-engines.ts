export type VoiceEngineKind = "browser" | "webgpu" | "wasm" | "native" | "python";
export type VoiceEngineCapability =
  "tts" | "voice-clone" | "multilingual" | "streaming" | "voice-design";

export type VoiceEngine = {
  id: string;
  name: string;
  kind: VoiceEngineKind;
  license: string;
  model: string;
  modelUrl: string;
  capabilities: VoiceEngineCapability[];
  languages: string[];
  preferredFor: "light" | "clone" | "quality" | "fallback";
  localOnly: true;
  notes: string;
};

export const OPEN_LOCAL_VOICE_ENGINES: VoiceEngine[] = [
  {
    id: "qwen3-tts-0.6b-onnx",
    name: "Qwen3-TTS 0.6B Base",
    kind: "webgpu",
    license: "Apache-2.0",
    model: "onnx-community/Qwen3-TTS-12Hz-0.6B-Base",
    modelUrl: "https://huggingface.co/onnx-community/Qwen3-TTS-12Hz-0.6B-Base",
    capabilities: ["tts", "voice-clone", "multilingual", "streaming"],
    languages: ["zh", "en", "ja", "ko", "de", "fr", "ru", "pt", "es", "it"],
    preferredFor: "clone",
    localOnly: true,
    notes:
      "Smallest Qwen3-TTS clone model we can target for device-local inference. Downloads only when the user chooses it.",
  },
  {
    id: "qwen3-tts-1.7b",
    name: "Qwen3-TTS 1.7B Base",
    kind: "native",
    license: "Apache-2.0",
    model: "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
    modelUrl: "https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base",
    capabilities: ["tts", "voice-clone", "multilingual", "streaming"],
    languages: ["zh", "en", "ja", "ko", "de", "fr", "ru", "pt", "es", "it"],
    preferredFor: "quality",
    localOnly: true,
    notes:
      "Higher-quality local Qwen clone option. Use through a native/llama.cpp-style local runner when the phone has sufficient memory.",
  },
  {
    id: "chatterbox-multilingual-v3",
    name: "Chatterbox Multilingual V3",
    kind: "native",
    license: "MIT",
    model: "ResembleAI/chatterbox",
    modelUrl: "https://github.com/resemble-ai/chatterbox",
    capabilities: ["tts", "voice-clone", "multilingual"],
    languages: ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "hi"],
    preferredFor: "clone",
    localOnly: true,
    notes:
      "Strong multilingual zero-shot cloning. Use locally through the open-source runtime; no hosted inference is required.",
  },
  {
    id: "chatterbox-onnx",
    name: "Chatterbox ONNX",
    kind: "webgpu",
    license: "MIT",
    model: "onnx-community/chatterbox-ONNX",
    modelUrl: "https://huggingface.co/onnx-community/chatterbox-ONNX",
    capabilities: ["tts", "voice-clone"],
    languages: ["en"],
    preferredFor: "clone",
    localOnly: true,
    notes:
      "Browser/ONNX route for English cloning. This is a community ONNX conversion, so the Studio treats it as an optional engine rather than assuming equivalence to the original runtime.",
  },
  {
    id: "f5-tts",
    name: "F5-TTS",
    kind: "python",
    license: "MIT-code / CC-BY-NC-model",
    model: "SWivid/F5-TTS",
    modelUrl: "https://github.com/SWivid/F5-TTS",
    capabilities: ["tts", "voice-clone", "multilingual"],
    languages: ["en", "zh"],
    preferredFor: "quality",
    localOnly: true,
    notes:
      "Excellent zero-shot cloning. The code is MIT, but pretrained model licensing is non-commercial, so the Studio must not describe it as unrestricted commercial content generation.",
  },
  {
    id: "cosyvoice-3",
    name: "CosyVoice 3",
    kind: "python",
    license: "Apache-2.0",
    model: "FunAudioLLM/CosyVoice",
    modelUrl: "https://github.com/FunAudioLLM/CosyVoice",
    capabilities: ["tts", "voice-clone", "multilingual", "streaming"],
    languages: ["zh", "en", "ja", "ko", "yue", "de", "es", "fr", "it"],
    preferredFor: "quality",
    localOnly: true,
    notes:
      "Powerful multilingual local engine. Its larger footprint makes it a better fit for a local runner than direct browser inference on modest phones.",
  },
  {
    id: "kokoro-82m",
    name: "Kokoro 82M",
    kind: "webgpu",
    license: "Apache-2.0",
    model: "onnx-community/Kokoro-82M-v1.0-ONNX",
    modelUrl: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX",
    capabilities: ["tts", "multilingual"],
    languages: ["en", "es", "fr", "it", "ja", "zh", "hi"],
    preferredFor: "light",
    localOnly: true,
    notes: "Keep as the lightweight everyday voice fallback. It is not a voice-cloning engine.",
  },
];

export function getVoiceEngine(id: string): VoiceEngine | undefined {
  return OPEN_LOCAL_VOICE_ENGINES.find((engine) => engine.id === id);
}

export function getCloneEngines(): VoiceEngine[] {
  return OPEN_LOCAL_VOICE_ENGINES.filter((engine) => engine.capabilities.includes("voice-clone"));
}

export function selectBestLocalCloneEngine(
  options: {
    webgpu?: boolean;
    preferLightweight?: boolean;
    languages?: string[];
  } = {},
): VoiceEngine {
  const requested = new Set(options.languages ?? []);
  const candidates = getCloneEngines().filter(
    (engine) =>
      requested.size === 0 || engine.languages.some((language) => requested.has(language)),
  );

  if (options.webgpu) {
    const browserClone = candidates.find(
      (engine) => engine.kind === "webgpu" && engine.id === "qwen3-tts-0.6b-onnx",
    );
    if (browserClone) return browserClone;
    const chatterbox = candidates.find((engine) => engine.id === "chatterbox-onnx");
    if (chatterbox) return chatterbox;
  }

  if (options.preferLightweight) {
    const light = candidates.find((engine) => engine.id === "qwen3-tts-0.6b-onnx");
    if (light) return light;
  }

  return (
    candidates.find((engine) => engine.id === "qwen3-tts-1.7b") ??
    candidates.find((engine) => engine.id === "chatterbox-multilingual-v3") ??
    candidates.find((engine) => engine.id === "cosyvoice-3") ??
    candidates[0] ??
    OPEN_LOCAL_VOICE_ENGINES[0]
  );
}

export function getEngineInstallInstructions(engine: VoiceEngine): string {
  switch (engine.id) {
    case "qwen3-tts-0.6b-onnx":
      return "Download the ONNX model into the device-local model cache and run it through the browser ONNX/WebGPU adapter.";
    case "qwen3-tts-1.7b":
      return "Install the model into a local native runner. No hosted Qwen API is required.";
    case "chatterbox-multilingual-v3":
      return "Install Chatterbox locally in the optional open-source Python runner.";
    case "chatterbox-onnx":
      return "Download the community ONNX model into the local browser model cache.";
    case "f5-tts":
      return "Install F5-TTS in the optional local Python runner. Check model licensing before commercial use.";
    case "cosyvoice-3":
      return "Install CosyVoice locally in the optional open-source Python runner.";
    default:
      return "Download the model into the local device cache.";
  }
}
