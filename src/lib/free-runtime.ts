/**
 * Free-only runtime capability registry.
 * Core Studio code must never require a paid provider or API key.
 *
 * This registry describes capabilities, not promises: an engine is only
 * considered usable after the live router verifies its public endpoint.
 */
export type RuntimeKind = "local-webgpu" | "free-hosted" | "browser-native";

export type FreeCapability = {
  id: string;
  label: string;
  kind: RuntimeKind;
  requiresApiKey: false;
  capabilities: string[];
  fallbackIds: string[];
  notes?: string;
};

export const FREE_CAPABILITIES: FreeCapability[] = [
  {
    id: "buddy-local-webgpu",
    label: "Buddy — local WebGPU",
    kind: "local-webgpu",
    requiresApiKey: false,
    capabilities: ["chat", "context", "reasoning", "lyrics"],
    fallbackIds: ["buddy-free-hosted"],
    notes: "Uses a browser-capable open model when the Android device supports WebGPU.",
  },
  {
    id: "buddy-free-hosted",
    label: "Buddy — free/open hosted runtime",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["chat", "context", "reasoning", "lyrics"],
    fallbackIds: ["buddy-local-webgpu"],
    notes: "Only usable after the live router verifies a public free runtime.",
  },
  {
    id: "music-ace-step",
    label: "ACE-Step 1.5",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["music", "lyrics-to-music", "audio-editing", "remix", "cover", "full-song"],
    fallbackIds: ["music-diffrhythm2", "music-open-fallback"],
    notes:
      "Primary open music-generation target; availability and endpoint schema are live-checked.",
  },
  {
    id: "music-diffrhythm2",
    label: "DiffRhythm 2",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["music", "lyrics-to-music", "full-song", "audio-style-reference"],
    fallbackIds: ["music-ace-step", "music-open-fallback"],
    notes:
      "Open full-song model with strong lyric alignment; public Space availability is checked at runtime.",
  },
  {
    id: "music-open-fallback",
    label: "Open music fallback",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["music", "lyrics-to-music", "full-song"],
    fallbackIds: ["music-ace-step", "music-diffrhythm2"],
    notes: "Only enabled when a current free/open public engine is verified reachable.",
  },
  {
    id: "image-z-image",
    label: "Z-Image Turbo",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["image", "artwork", "cover", "image-edit"],
    fallbackIds: ["image-open-fallback"],
    notes: "Fast open image generation target; endpoint schema is verified before use.",
  },
  {
    id: "image-open-fallback",
    label: "Open image fallback",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["image", "artwork", "cover"],
    fallbackIds: ["image-z-image"],
    notes: "Only enabled when a current public engine is verified reachable.",
  },
  {
    id: "video-wan",
    label: "Wan 2.2 video",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["video", "image-to-video", "audio-to-video", "music-video"],
    fallbackIds: ["video-open-fallback"],
    notes:
      "Use only when the public Space exposes a usable no-key endpoint; otherwise fall through silently.",
  },
  {
    id: "video-open-fallback",
    label: "Open video fallback",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["video", "image-to-video", "audio-to-video"],
    fallbackIds: ["video-wan"],
    notes: "Only enabled when a current free/open public engine is verified reachable.",
  },
  {
    id: "voice-qwen3-tts",
    label: "Qwen3-TTS",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["voice-clone", "tts", "voice", "languages"],
    fallbackIds: ["voice-kokoro"],
    notes: "Primary open multilingual voice-cloning/TTS target.",
  },
  {
    id: "voice-kokoro",
    label: "Kokoro",
    kind: "browser-native",
    requiresApiKey: false,
    capabilities: ["tts", "voice", "languages"],
    fallbackIds: ["voice-qwen3-tts"],
    notes: "Lightweight browser speech fallback when the device supports it.",
  },
  {
    id: "voice-seed-vc",
    label: "Seed-VC",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["voice-conversion", "vocal-swap", "singing-voice-conversion"],
    fallbackIds: ["voice-rvc"],
    notes: "Zero-shot speech/singing conversion target with automatic pitch handling behind Buddy.",
  },
  {
    id: "voice-rvc",
    label: "RVC / Applio",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["voice-conversion", "vocal-swap", "singing-voice-conversion"],
    fallbackIds: ["voice-seed-vc"],
    notes: "Open RVC-family fallback for user-owned voices and authorized transformations.",
  },
  {
    id: "vocal-separation",
    label: "Open vocal separation",
    kind: "free-hosted",
    requiresApiKey: false,
    capabilities: ["vocal-separation", "stems", "vocal-isolation"],
    fallbackIds: [],
    notes:
      "Required before replacing vocals in a mixed song; route is live-checked before execution.",
  },
  {
    id: "browser-audio",
    label: "Browser Audio",
    kind: "browser-native",
    requiresApiKey: false,
    capabilities: ["record", "trim", "split", "fade", "normalize", "preview", "export", "mix"],
    fallbackIds: [],
  },
];

export function getFreeCapabilities(capability: string) {
  return FREE_CAPABILITIES.filter((engine) => engine.capabilities.includes(capability));
}

export function hasRequiredPaidCredential(engine: FreeCapability) {
  return engine.requiresApiKey;
}
