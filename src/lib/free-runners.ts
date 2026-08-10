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
    name: "Z Image Turbo",
    kind: "public",
    description: "Fast high-quality text-to-image generation for covers and artwork.",
    capabilities: ["image", "artwork", "cover"],
    url: "https://huggingface.co/spaces/mrfakename/Z-Image-Turbo",
    notes: "Primary public image route; capability discovery must confirm the current endpoint.",
    priority: 140,
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
    id: "hf-wan-s2v",
    name: "Wan 2.2 S2V",
    kind: "public",
    description: "Image + audio conditioned video generation for music-video workflows.",
    capabilities: ["video", "image-to-video", "audio-to-video", "music-video"],
    url: "https://huggingface.co/spaces/Wan-AI/Wan2.2-S2V",
    notes: "Current primary open video route; heavy jobs may queue.",
    priority: 145,
  },
  {
    id: "hf-ltx-studio",
    name: "LTX Studio",
    kind: "public",
    description: "Video-generation fallback from text, images and audio where the live API supports it.",
    capabilities: ["video", "image-to-video", "audio-to-video"],
    url: "https://huggingface.co/spaces/techfreakworm/LTX2.3-Studio",
    notes: "Fallback only; live endpoint inspection is required.",
    priority: 95,
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
