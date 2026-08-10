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
 * Free/no-key execution routes. These are real public/open tools, not fake
 * placeholder buttons. Heavy models run on the public service; lightweight
 * browser tools can run on-device. The Studio never claims remote generation
 * happened until the user actually starts it in the destination.
 */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "qwen3-webgpu",
    name: "Qwen3 WebGPU",
    kind: "android",
    description: "Local browser reasoning and writing on capable WebGPU devices.",
    capabilities: ["text", "writing", "lyrics"],
    url: "https://huggingface.co/spaces/webml-community/qwen3-webgpu",
    notes: "Local browser route; device capability determines speed.",
    priority: 110,
  },
  {
    id: "hf-ace-step",
    name: "ACE-Step 1.5",
    kind: "public",
    description: "Full-song music generation, lyrics-to-song, editing and remix workflows.",
    capabilities: ["music", "song", "lyrics-to-music"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes: "Open music engine with a public Space; shared free capacity can queue.",
    priority: 110,
  },
  {
    id: "hf-rvc",
    name: "Applio / RVC",
    kind: "public",
    description: "High-quality RVC voice conversion and custom-model workflows.",
    capabilities: ["voice", "voice-swap", "singing-voice-conversion", "voice-training"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Official Applio Space; use only voices/audio you have permission to transform.",
    priority: 110,
  },
  {
    id: "hf-seed-vc",
    name: "Seed-VC",
    kind: "public",
    description: "Zero-shot speech and singing voice conversion using source + reference audio.",
    capabilities: ["voice", "voice-swap", "singing-voice-conversion"],
    url: "https://huggingface.co/spaces/Plachta/Seed-VC",
    notes: "Excellent no-training voice-swap fallback; singing mode supports F0 conditioning.",
    priority: 108,
  },
  {
    id: "hf-qwen3-tts",
    name: "Qwen3-TTS",
    kind: "public",
    description: "Voice design, voice cloning from reference audio, and natural TTS.",
    capabilities: ["voice", "voice-clone", "tts"],
    url: "https://huggingface.co/spaces/Qwen/Qwen3-TTS",
    notes: "Official Qwen Space running on Zero GPU; supports 0.6B/1.7B model sizes.",
    priority: 108,
  },
  {
    id: "hf-kokoro",
    name: "Kokoro TTS WebGPU",
    kind: "android",
    description: "Lightweight browser speech synthesis.",
    capabilities: ["tts", "voice"],
    url: "https://huggingface.co/spaces/webml-community/kokoro-webgpu",
    notes: "Good lightweight phone route for ordinary narration.",
    priority: 90,
  },
  {
    id: "hf-z-image",
    name: "Z Image Turbo",
    kind: "public",
    description: "Fast high-quality text-to-image generation for covers and artwork.",
    capabilities: ["image", "artwork", "cover"],
    url: "https://huggingface.co/spaces/mrfakename/Z-Image-Turbo",
    notes: "Currently listed as a running Zero/MCP Space; shared capacity varies.",
    priority: 110,
  },
  {
    id: "hf-sdxl",
    name: "SDXL Turbo",
    kind: "public",
    description: "Text-to-image and image-to-image fallback.",
    capabilities: ["image", "artwork", "cover", "image-edit"],
    url: "https://huggingface.co/spaces/diffusers/unofficial-SDXL-Turbo-i2i-t2i",
    notes: "Fallback if the preferred image Space is unavailable.",
    priority: 85,
  },
  {
    id: "hf-wan-s2v",
    name: "Wan 2.2 S2V",
    kind: "public",
    description: "Real image + audio conditioned video generation.",
    capabilities: ["video", "image-to-video", "audio-to-video", "music-video"],
    url: "https://huggingface.co/spaces/Wan-AI/Wan2.2-S2V",
    notes: "Official Wan Space and currently running; heavy jobs may queue.",
    priority: 110,
  },
  {
    id: "hf-ltx-studio",
    name: "LTX 2.3 Studio",
    kind: "public",
    description: "Video generation fallback from text, images and audio.",
    capabilities: ["video", "image-to-video", "audio-to-video"],
    url: "https://huggingface.co/spaces/techfreakworm/LTX2.3-Studio",
    notes: "Use as a second public video route when Wan is busy.",
    priority: 95,
  },
  {
    id: "hf-demucs",
    name: "Demucs",
    kind: "public",
    description: "Open vocal/instrument stem separation.",
    capabilities: ["stems", "vocal-isolation"],
    url: "https://huggingface.co/spaces/nakas/demucs_playground",
    notes: "Shared compute; long tracks can take longer.",
    priority: 90,
  },
  {
    id: "kaggle",
    name: "Kaggle Notebooks",
    kind: "gpu",
    description: "Free browser GPU workspace for heavier open-source models and training.",
    capabilities: ["voice-training", "music", "image", "video", "stems", "training"],
    url: "https://www.kaggle.com/code",
    notes: "Fallback for heavy open models when public Spaces are unavailable; no computer required.",
    priority: 20,
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
