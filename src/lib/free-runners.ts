export type FreeRunner = {
  id: string;
  name: string;
  kind: "android" | "public" | "gpu";
  description: string;
  capabilities: string[];
  url: string;
  notes: string;
  priority: number;
};

/**
 * Free/no-key execution routes. Priority is a routing hint only; the runtime
 * must health-check and capability-check a route before using it.
 *
 * IMPORTANT: these are fallbacks/engine references, not mandatory dependencies.
 * The Studio must remain usable if any individual public Space disappears,
 * sleeps, changes its API, or becomes overloaded.
 */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "hf-ace-step-15",
    name: "ACE-Step 1.5",
    kind: "public",
    description: "Open full-song music generation with lyrics, vocals, backing and editing workflows.",
    capabilities: ["music", "song", "lyrics-to-music", "audio-to-audio"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes: "Current primary open music route. The runtime must inspect the live Gradio API rather than assuming endpoint names.",
    priority: 140,
  },
  {
    id: "hf-ace-step",
    name: "ACE-Step",
    kind: "public",
    description: "Current official ACE-Step public Space and music-generation fallback.",
    capabilities: ["music", "song", "lyrics-to-music"],
    url: "https://huggingface.co/spaces/ACE-Step/ACE-Step",
    notes: "Official public Space; shared ZeroGPU capacity varies.",
    priority: 132,
  },
  {
    id: "hf-diffrhythm2",
    name: "DiffRhythm 2",
    kind: "public",
    description: "Lyrics-conditioned full-song generation with text or audio style prompts.",
    capabilities: ["music", "song", "lyrics-to-music", "style-conditioning"],
    url: "https://huggingface.co/spaces/ASLP-lab/DiffRhythm2",
    notes: "Strong fast full-song fallback; live Space is currently available.",
    priority: 128,
  },
  {
    id: "hf-qwen3-webgpu",
    name: "Qwen3 WebGPU",
    kind: "android",
    description: "Local browser reasoning and writing on capable WebGPU devices.",
    capabilities: ["text", "writing", "lyrics"],
    url: "https://huggingface.co/spaces/webml-community/qwen3-webgpu",
    notes: "Optional local route; device capability determines speed. Never required for core Studio operation.",
    priority: 110,
  },
  {
    id: "hf-qwen3-tts",
    name: "Qwen3-TTS",
    kind: "public",
    description: "Natural multilingual speech, reference-voice cloning and predefined voices.",
    capabilities: ["voice", "voice-clone", "tts", "multilingual-tts"],
    url: "https://huggingface.co/spaces/Qwen/Qwen3-TTS",
    notes: "Official Qwen Space currently running on ZeroGPU; supports Voice Clone and CustomVoice.",
    priority: 145,
  },
  {
    id: "hf-seed-vc",
    name: "Seed-VC",
    kind: "public",
    description: "Zero-shot speech and singing voice conversion using source and reference audio.",
    capabilities: ["voice", "voice-swap", "singing-voice-conversion"],
    url: "https://huggingface.co/spaces/Plachta/Seed-VC",
    notes: "Primary no-training singing-voice conversion fallback; use only voices the user owns or is authorized to transform.",
    priority: 142,
  },
  {
    id: "hf-ai-rvc",
    name: "AI-RVC",
    kind: "public",
    description: "One-click AI cover workflow that separates vocals, converts the singer and remixes the result.",
    capabilities: ["voice-swap", "singing-voice-conversion", "ai-cover", "vocal-separation", "audio-mix"],
    url: "https://huggingface.co/spaces/mason369/AI-RVC",
    notes: "Useful whole-song cover fallback. It is only selected when its live API advertises compatible inputs.",
    priority: 125,
  },
  {
    id: "hf-rvc-zero",
    name: "RVC Zero",
    kind: "public",
    description: "Current RVC voice-conversion framework running on public ZeroGPU capacity.",
    capabilities: ["voice", "voice-swap", "singing-voice-conversion"],
    url: "https://huggingface.co/spaces/r3gm/RVC-ZERO",
    notes: "Fallback only; runtime capability discovery is mandatory because public RVC Spaces vary in exposed controls.",
    priority: 118,
  },
  {
    id: "hf-whisper-fast-en",
    name: "Fast Whisper English",
    kind: "public",
    description: "Simple public Gradio transcription endpoint for fast English speech recognition.",
    capabilities: ["speech-to-text", "transcription", "realtime-asr"],
    url: "https://huggingface.co/spaces/abidlabs/fast-whisper-en-api",
    notes: "Stable simple /transcribe endpoint; English-focused fallback for live Buddy speech input.",
    priority: 146,
  },
  {
    id: "hf-whisper-realtime",
    name: "Realtime Whisper Large-v3-Turbo",
    kind: "public",
    description: "Realtime browser-friendly speech recognition fallback for Buddy conversation.",
    capabilities: ["speech-to-text", "realtime-asr", "conversation"],
    url: "https://huggingface.co/spaces/KingNish/Realtime-whisper-large-v3-turbo",
    notes: "Use as a live-conversation fallback; do not depend exclusively on browser SpeechRecognition.",
    priority: 138,
  },
  {
    id: "hf-whisper-large-v3-turbo",
    name: "Whisper Large-v3-Turbo",
    kind: "public",
    description: "High-quality speech recognition for uploaded or recorded audio.",
    capabilities: ["speech-to-text", "transcription"],
    url: "https://huggingface.co/spaces/hf-audio/whisper-large-v3-turbo",
    notes: "Upload/transcription fallback; live API is health-checked before selection.",
    priority: 120,
  },
  {
    id: "hf-z-image",
    name: "Z Image Turbo Stable API",
    kind: "public",
    description: "High-quality text-to-image generation through the stable hf-applications Gradio endpoint.",
    capabilities: ["image", "artwork", "cover"],
    url: "https://huggingface.co/spaces/hf-applications/Z-Image-Turbo",
    notes: "Uses the current public /generate_image endpoint documented by Hugging Face's Daggr examples, avoiding the newer workflow-only upstream variant.",
    priority: 150,
  },
  {
    id: "hf-z-image-upstream",
    name: "Z Image Turbo Upstream",
    kind: "public",
    description: "Upstream Z-Image-Turbo Space fallback.",
    capabilities: ["image", "artwork", "cover"],
    url: "https://huggingface.co/spaces/mrfakename/Z-Image-Turbo",
    notes: "Fallback only because the upstream Space has recently changed between standard Gradio and Workflow implementations.",
    priority: 115,
  },
  {
    id: "hf-sdxl",
    name: "SDXL Turbo",
    kind: "public",
    description: "Text-to-image and image-to-image fallback.",
    capabilities: ["image", "artwork", "cover", "image-edit"],
    url: "https://huggingface.co/spaces/diffusers/unofficial-SDXL-Turbo-i2i-t2i",
    notes: "Fallback only when a stronger current image route is unavailable.",
    priority: 85,
  },
  {
    id: "hf-ltx-23",
    name: "LTX 2.3 Distilled",
    kind: "public",
    description: "Open image-to-video and text-to-video generation with native generated audio.",
    capabilities: ["video", "image-to-video", "text-to-video", "audio-to-video", "music-video"],
    url: "https://huggingface.co/spaces/Lightricks/LTX-2-3",
    notes: "Primary free video route. It runs the open LTX-2.3 model directly in ZeroGPU; no user API key or paid provider is required.",
    priority: 150,
  },
  {
    id: "hf-wan-22",
    name: "Wan 2.2",
    kind: "public",
    description: "Open text-to-video and image-to-video generation for cinematic shots, character motion and controllable visual sequences.",
    capabilities: ["video", "image-to-video", "text-to-video", "animation", "music-video"],
    url: "https://huggingface.co/spaces/wan-ai/Wan2.2-T2V-A14B",
    notes: "Second production video route. The runtime must inspect the live Gradio API and use it only when the Space exposes a compatible endpoint; it is an alternate engine rather than a mandatory dependency.",
    priority: 145,
  },
  {
    id: "hf-ltx-video-distilled",
    name: "LTX Video Fast",
    kind: "public",
    description: "Fast open video generation fallback using the distilled LTX video model.",
    capabilities: ["video", "image-to-video", "text-to-video"],
    url: "https://huggingface.co/spaces/Lightricks/ltx-video-distilled",
    notes: "Free public fallback; runtime capability discovery is mandatory.",
    priority: 115,
  },
  {
    id: "hf-ltx-studio",
    name: "LTX 2.3 Fast",
    kind: "public",
    description: "Open LTX 2.3 image-to-video fallback using ComfyUI in-process on ZeroGPU.",
    capabilities: ["video", "image-to-video", "text-to-video", "audio-to-video"],
    url: "https://huggingface.co/spaces/ShaundeOoO/ltx-2.3-fast",
    notes: "Fallback only; the live endpoint is inspected before use.",
    priority: 100,
  },
  {
    id: "hf-demucs",
    name: "Demucs Stem Separation",
    kind: "public",
    description: "Open vocal/instrument stem separation for the user's own songs.",
    capabilities: ["stems", "vocal-isolation", "vocal-separation"],
    url: "https://huggingface.co/spaces/nakas/demucs_playground",
    notes: "Used as a component of the song voice-swap pipeline when a whole-song cover engine is unsuitable.",
    priority: 105,
  },
  {
    id: "hf-applio",
    name: "Applio / RVC",
    kind: "public",
    description: "Open RVC voice-conversion and custom-model workflow.",
    capabilities: ["voice", "voice-swap", "singing-voice-conversion", "voice-training"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Optional advanced fallback; never required for ordinary Studio use.",
    priority: 100,
  },
  {
    id: "hf-kokoro",
    name: "Kokoro TTS WebGPU",
    kind: "android",
    description: "Lightweight browser speech synthesis fallback.",
    capabilities: ["tts", "voice"],
    url: "https://huggingface.co/spaces/webml-community/kokoro-webgpu",
    notes: "Fast local fallback when remote TTS is unavailable; quality is below the primary natural-voice route.",
    priority: 80,
  },
];

export function runnersFor(capability?: string) {
  const runners = capability
    ? FREE_RUNNERS.filter((runner) => runner.capabilities.includes(capability))
    : FREE_RUNNERS;
  return [...runners].sort((a, b) => b.priority - a.priority);
}

export function bestFreeRunner(capability: string) {
  return runnersFor(capability)[0] ?? null;
}
