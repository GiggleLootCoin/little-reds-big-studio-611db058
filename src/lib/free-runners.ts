export type FreeRunner = {
  id: string;
  name: string;
  kind: "android" | "public" | "gpu";
  description: string;
  capabilities: string[];
  url: string;
  notes: string;
};

/** Free/no-key execution routes. Heavy models run in a separate browser tab. */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "hf-rvc",
    name: "Applio / RVC",
    kind: "public",
    description: "Voice conversion and RVC workflows.",
    capabilities: ["voice"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Official Applio Space; bring the finished audio back into the Studio.",
  },
  {
    id: "hf-kokoro",
    name: "Kokoro TTS WebGPU",
    kind: "android",
    description: "Fast open text-to-speech directly in the browser.",
    capabilities: ["voice", "text"],
    url: "https://huggingface.co/spaces/webml-community/kokoro-webgpu",
    notes: "A strong lightweight Android-friendly voice fallback using WebGPU.",
  },
  {
    id: "hf-ace-step",
    name: "ACE-Step 1.5",
    kind: "public",
    description: "Open full-song generation, editing, cover and vocal-to-BGM workflows.",
    capabilities: ["music"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes: "Verified public ZeroGPU Space; shared free capacity can be busy.",
  },
  {
    id: "hf-musicgen",
    name: "MusicGen Web",
    kind: "android",
    description: "Lighter browser music-generation option.",
    capabilities: ["music", "small-audio"],
    url: "https://huggingface.co/spaces/Xenova/musicgen-web",
    notes: "Best for shorter/lighter jobs on capable phones.",
  },
  {
    id: "hf-demucs",
    name: "Demucs",
    kind: "public",
    description: "Open vocal/instrument stem separation.",
    capabilities: ["stems"],
    url: "https://huggingface.co/spaces/nakas/demucs_playground",
    notes: "Separate stems externally, then import them into the Studio.",
  },
  {
    id: "hf-wan-video",
    name: "Wan 2.2 Video",
    kind: "public",
    description: "Open image-to-video generation.",
    capabilities: ["video", "image-to-video"],
    url: "https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster",
    notes: "Public ZeroGPU route; availability depends on shared capacity.",
  },
  {
    id: "hf-sdxl",
    name: "SDXL Turbo",
    kind: "public",
    description: "Open text-to-image generation through a public Space.",
    capabilities: ["image"],
    url: "https://huggingface.co/spaces/Goli-ai16/stabilityai-stable-diffusion-xl-base-1.0",
    notes: "Public SDXL demo; shared compute availability can vary.",
  },
  {
    id: "kaggle",
    name: "Kaggle Notebooks",
    kind: "gpu",
    description: "Free browser GPU workspace for heavier open-source models.",
    capabilities: ["voice", "stems", "video", "image", "music", "training", "text"],
    url: "https://www.kaggle.com/code",
    notes: "Use as a heavier fallback when a public runner is unavailable.",
  },
];

export function runnersFor(capability?: string) {
  if (!capability) return FREE_RUNNERS;
  return FREE_RUNNERS.filter((runner) => runner.capabilities.includes(capability));
}

export function bestFreeRunner(capability: string) {
  return runnersFor(capability)[0] ?? null;
}
