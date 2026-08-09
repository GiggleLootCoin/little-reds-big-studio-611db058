export type MediaEngineKind = "music" | "image" | "video";

export type FreeOpenMediaEngine = {
  id: string;
  name: string;
  kind: MediaEngineKind;
  local: boolean;
  openSource: boolean;
  apiRequired: false;
  strengths: string[];
  androidFit: "excellent" | "good" | "runner";
  notes: string;
};

/**
 * Model/runner registry. This is metadata only: model weights are downloaded
 * on demand rather than committed to Git. No hosted inference is required.
 */
export const FREE_OPEN_MEDIA_ENGINES: FreeOpenMediaEngine[] = [
  {
    id: "musicgen-small",
    name: "MusicGen Small",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-music", "instrumentals", "short ideas"],
    androidFit: "good",
    notes: "Lightweight local starting point; best for sketches and shorter generations.",
  },
  {
    id: "stable-audio-open",
    name: "Stable Audio Open",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-audio", "sound design", "music ideas"],
    androidFit: "runner",
    notes: "Use locally where hardware permits; model license must be checked for the intended use.",
  },
  {
    id: "ace-step",
    name: "ACE-Step",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["full songs", "lyrics-to-song", "music editing"],
    androidFit: "runner",
    notes: "Preferred heavier open local music-generation runner when the phone cannot handle the model.",
  },
  {
    id: "stable-diffusion-xl",
    name: "Stable Diffusion XL",
    kind: "image",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-image", "covers", "concept art", "image-to-image"],
    androidFit: "good",
    notes: "Strong general image baseline; use a quantized/mobile-compatible runtime where available.",
  },
  {
    id: "flux-schnell",
    name: "FLUX.1-schnell",
    kind: "image",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["fast image generation", "covers", "concept art"],
    androidFit: "runner",
    notes: "High-quality fast model; use only where its license matches the user's intended use.",
  },
  {
    id: "sdxl-controlnet",
    name: "SDXL + ControlNet",
    kind: "image",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["pose control", "composition", "character consistency", "image editing"],
    androidFit: "runner",
    notes: "Advanced image-control pipeline for consistent characters and compositions.",
  },
  {
    id: "stable-video-diffusion",
    name: "Stable Video Diffusion",
    kind: "video",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["image-to-video", "short clips", "motion"],
    androidFit: "runner",
    notes: "Heavy local workload; suitable for a local runner rather than most phones.",
  },
  {
    id: "animatediff",
    name: "AnimateDiff",
    kind: "video",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-video", "image-to-video", "animation"],
    androidFit: "runner",
    notes: "Composable open animation pipeline; particularly useful with ControlNet workflows.",
  },
  {
    id: "wan-video",
    name: "Wan Video",
    kind: "video",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["image-to-video", "text-to-video", "high-quality motion"],
    androidFit: "runner",
    notes: "High-end option for a capable local machine/runner; not a realistic default for low-memory phones.",
  },
];

export function getMediaEngines(kind: MediaEngineKind): FreeOpenMediaEngine[] {
  return FREE_OPEN_MEDIA_ENGINES.filter((engine) => engine.kind === kind);
}

export function chooseMediaEngine(kind: MediaEngineKind, preferQuality = false): FreeOpenMediaEngine {
  const engines = getMediaEngines(kind);
  return engines.find((engine) => preferQuality && engine.androidFit === "runner")
    ?? engines.find((engine) => engine.androidFit === "good")
    ?? engines[0];
}
