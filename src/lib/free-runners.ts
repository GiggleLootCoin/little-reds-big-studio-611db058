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
 * Free/no-key execution routes. These are external open/free workflows, not
 * paid APIs. Buddy keeps them invisible to normal users and can fall back to
 * another route when a public Space is unavailable.
 */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "qwen3-webgpu",
    name: "Qwen3 WebGPU",
    kind: "android",
    description:
      "Local browser reasoning and writing on capable WebGPU devices.",
    capabilities: ["text", "writing"],
    url: "https://huggingface.co/spaces/webml-community/qwen3-webgpu",
    notes:
      "Verified public WebGPU Space; runs locally in the browser and depends on device capability.",
    priority: 110,
  },
  {
    id: "bonsai-webgpu",
    name: "Bonsai WebGPU",
    kind: "android",
    description:
      "Local browser reasoning and writing on capable WebGPU devices.",
    capabilities: ["text", "writing"],
    url: "https://huggingface.co/spaces/webml-community/bonsai-webgpu-kernels",
    notes:
      "Runs the model in the browser; first load can be large and phone performance varies.",
    priority: 100,
  },
  {
    id: "hf-rvc",
    name: "Applio / RVC",
    kind: "public",
    description: "High-quality RVC voice conversion.",
    capabilities: ["voice"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Official Applio Space; shared capacity can be busy.",
    priority: 100,
  },
  {
    id: "hf-kokoro",
    name: "Kokoro TTS WebGPU",
    kind: "android",
    description: "Lightweight browser speech synthesis.",
    capabilities: ["voice", "text"],
    url: "https://huggingface.co/spaces/webml-community/kokoro-webgpu",
    notes:
      "Designed for browser/WebGPU use; a good lightweight phone route.",
    priority: 90,
  },
  {
    id: "hf-qwen3-tts",
    name: "Qwen3-TTS",
    kind: "public",
    description:
      "Modern speech generation, voice design and cloning demo.",
    capabilities: ["voice", "text"],
    url: "https://huggingface.co/spaces/Qwen/Qwen3-TTS",
    notes:
      "Use as a quality fallback when the lightweight local voice route is not suitable.",
    priority: 85,
  },
  {
    id: "hf-ace-step",
    name: "ACE-Step 1.5",
    kind: "public",
    description: "Open music generation and music-editing workflows.",
    capabilities: ["music"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes:
      "Official public ZeroGPU Space; shared free capacity can be busy.",
    priority: 100,
  },
  {
    id: "hf-musicgen",
    name: "MusicGen Web",
    kind: "android",
    description: "Smaller browser-based music generation.",
    capabilities: ["music", "small-audio"],
    url: "https://huggingface.co/spaces/Xenova/musicgen-web",
    notes:
      "Runs locally in the browser and is useful for lighter jobs.",
    priority: 80,
  },
  {
    id: "hf-demucs",
    name: "Demucs",
    kind: "public",
    description: "Open vocal/instrument stem separation.",
    capabilities: ["stems"],
    url: "https://huggingface.co/spaces/nakas/demucs_playground",
    notes: "Long tracks may take time on shared compute.",
    priority: 90,
  },
  {
    id: "hf-bs-roformer",
    name: "BS-Roformer",
    kind: "public",
    description: "Modern open audio separation fallback.",
    capabilities: ["stems"],
    url: "https://huggingface.co/spaces/huggingapps/BS-Roformer-Leap-Audio-Separator",
    notes:
      "Useful fallback when Demucs is queued or unavailable.",
    priority: 80,
  },
  {
    id: "hf-wan-s2v",
    name: "Wan 2.2 S2V",
    kind: "public",
    description: "Image + audio conditioned video generation.",
    capabilities: ["video", "image-to-video", "audio-to-video"],
    url: "https://huggingface.co/spaces/Wan-AI/Wan2.2-S2V",
    notes:
      "Official Wan Space; heavy jobs can encounter long queues.",
    priority: 100,
  },
  {
    id: "hf-ltx-studio",
    name: "LTX 2.3 Studio",
    kind: "public",
    description: "Video generation from text, images and audio.",
    capabilities: ["video", "image-to-video", "audio-to-video"],
    url: "https://huggingface.co/spaces/techfreakworm/LTX2.3-Studio",
    notes:
      "Free ZeroGPU public Space; excellent fallback for audio-conditioned video.",
    priority: 95,
  },
  {
    id: "hf-wan-video",
    name: "Wan 2.2 Video",
    kind: "public",
    description: "Fast open image-to-video generation.",
    capabilities: ["video", "image-to-video"],
    url: "https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster",
    notes:
      "Fast public ZeroGPU route; shared availability varies.",
    priority: 90,
  },
  {
    id: "hf-z-image",
    name: "Z Image Turbo",
    kind: "public",
    description: "Fast open text-to-image generation.",
    capabilities: ["image"],
    url: "https://huggingface.co/spaces/mrfakename/Z-Image-Turbo",
    notes: "Current public ZeroGPU image route.",
    priority: 100,
  },
  {
    id: "hf-sdxl",
    name: "SDXL Turbo",
    kind: "public",
    description:
      "Fast open text-to-image and image-editing fallback.",
    capabilities: ["image"],
    url: "https://huggingface.co/spaces/diffusers/unofficial-SDXL-Turbo-i2i-t2i",
    notes: "Use when the preferred image route is unavailable.",
    priority: 80,
  },
  {
    id: "kaggle",
    name: "Kaggle Notebooks",
    kind: "gpu",
    description:
      "Free browser GPU workspace for heavier open-source models.",
    capabilities: [
      "voice",
      "stems",
      "video",
      "image",
      "music",
      "training",
      "text",
      "writing",
    ],
    url: "https://www.kaggle.com/code",
    notes:
      "Last-resort heavy-compute fallback; still requires the user to run the notebook.",
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
