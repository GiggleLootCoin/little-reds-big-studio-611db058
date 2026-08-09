export type MediaEngineKind = "music" | "image" | "video" | "ai";

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
 * Open/local model registry. Metadata only: model weights are downloaded on
 * demand rather than committed to Git. Hosted inference is never required.
 * A model is not treated as installed merely because it appears here.
 */
export const FREE_OPEN_MEDIA_ENGINES: FreeOpenMediaEngine[] = [
  {
    id: "heartmula-oss-3b",
    name: "HeartMuLa OSS 3B",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["full songs", "lyrics-to-song", "multilingual", "section control", "reference audio"],
    androidFit: "runner",
    notes: "Top-tier open song-generation choice; Apache-2.0 project and weights. Heavy for most phones.",
  },
  {
    id: "ace-step-1.5",
    name: "ACE-Step 1.5",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["full songs", "vocals", "lyrics-to-song", "editing", "remix", "cover", "vocal-to-BGM"],
    androidFit: "runner",
    notes: "Primary high-performance open music engine; supports long compositions and advanced editing.",
  },
  {
    id: "diffrhythm-2",
    name: "DiffRhythm 2",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["full songs", "high-fidelity", "lyrics alignment", "controllable generation", "efficient synthesis"],
    androidFit: "runner",
    notes: "High-quality alternative to ACE-Step and HeartMuLa. Verify the exact model-weight license before commercial export.",
  },
  {
    id: "laguna-s-2.1",
    name: "Laguna S 2.1",
    kind: "ai",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["reasoning", "coding", "long-context", "agent planning"],
    androidFit: "runner",
    notes: "Large local reasoning model; use only when the device/runtime can support an appropriate quantization. Not a music generator.",
  },
  {
    id: "yue",
    name: "YuE",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["long-form songs", "lyrics alignment", "vocal melodies", "style transfer"],
    androidFit: "runner",
    notes: "Strong long-form lyrics-to-song engine; heavier than mobile-first models.",
  },
  {
    id: "riffusion",
    name: "Riffusion",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["music ideas", "loops", "audio experiments", "prompt exploration"],
    androidFit: "good",
    notes: "Experimental/fast ideation engine; use a locally runnable open implementation rather than a hosted API.",
  },
  {
    id: "musicgen-small",
    name: "MusicGen Small",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-music", "instrumentals", "short ideas"],
    androidFit: "good",
    notes: "Lightweight fallback for sketches and short generations.",
  },
  {
    id: "stable-audio-open",
    name: "Stable Audio Open",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["text-to-audio", "sound design", "music ideas", "loops"],
    androidFit: "runner",
    notes: "Useful open audio model; verify the model license for commercial use before export.",
  },
  {
    id: "stable-audio-3",
    name: "Stable Audio 3",
    kind: "music",
    local: true,
    openSource: true,
    apiRequired: false,
    strengths: ["instrumentals", "high-fidelity audio", "tempo/key control"],
    androidFit: "runner",
    notes: "High-quality option; license/model availability must be checked per release.",
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
    notes: "High-quality fast model; check its license against intended commercial use.",
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
    notes: "Heavy local workload; suitable for a capable local runner rather than most phones.",
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
    notes: "High-end open video option; generally requires a stronger local runtime.",
  },
];

export function getMediaEngines(kind: MediaEngineKind): FreeOpenMediaEngine[] {
  return FREE_OPEN_MEDIA_ENGINES.filter((engine) => engine.kind === kind);
}

export function chooseMediaEngine(
  kind: MediaEngineKind,
  preferQuality = false,
): FreeOpenMediaEngine | undefined {
  const engines = getMediaEngines(kind);
  return (
    engines.find((engine) => preferQuality && engine.androidFit === "runner") ??
    engines.find((engine) => engine.androidFit === "excellent") ??
    engines.find((engine) => engine.androidFit === "good") ??
    engines[0]
  );
}
