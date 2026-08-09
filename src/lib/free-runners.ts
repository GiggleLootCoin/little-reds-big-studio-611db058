export type FreeRunner = {
  id: string;
  name: string;
  kind: "android" | "public" | "gpu";
  description: string;
  capabilities: string[];
  url: string;
  notes: string;
};

/**
 * Free/no-key execution routes. These are intentionally external browser
 * workflows rather than pretend API integrations: the Studio never requires
 * a paid provider credential to use them.
 */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "hf-rvc",
    name: "Applio / RVC",
    kind: "public",
    description: "Free browser-based voice conversion for RVC workflows.",
    capabilities: ["voice"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Open the Space, run the conversion there, then bring the result back to the Studio.",
  },
  {
    id: "hf-ace-step",
    name: "ACE-Step 1.5",
    kind: "public",
    description: "Free browser music generation and editing using the public Space.",
    capabilities: ["music"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes: "Shared public GPU availability applies; no Studio API key is required.",
  },
  {
    id: "hf-musicgen",
    name: "MusicGen Web",
    kind: "android",
    description: "In-browser MusicGen option for lighter music-generation jobs.",
    capabilities: ["music", "small-audio"],
    url: "https://huggingface.co/spaces/Xenova/musicgen-web",
    notes: "Best suited to shorter/lighter jobs on capable phones.",
  },
  {
    id: "hf-demucs",
    name: "Demucs",
    kind: "public",
    description: "Free browser stem-separation workflow.",
    capabilities: ["stems"],
    url: "https://huggingface.co/spaces/nakas/demucs_playground",
    notes: "Separate vocals/instruments externally, then import the stems into the Studio.",
  },
  {
    id: "hf-wan-video",
    name: "Wan 2.2 Video",
    kind: "public",
    description: "Free public image-to-video workflow using shared GPU infrastructure.",
    capabilities: ["video", "image-to-video"],
    url: "https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster",
    notes: "Shared free GPU quota can be busy; no Studio API key is required.",
  },
  {
    id: "kaggle",
    name: "Kaggle Notebooks",
    kind: "gpu",
    description: "Free browser GPU workspace for heavier open-source models.",
    capabilities: ["voice", "stems", "video", "image", "music", "training", "text"],
    url: "https://www.kaggle.com/code",
    notes: "Use as a heavier fallback when a public Space is unavailable.",
  },
];

export function runnersFor(capability?: string) {
  if (!capability) return FREE_RUNNERS;
  return FREE_RUNNERS.filter((runner) => runner.capabilities.includes(capability));
}

export function bestFreeRunner(capability: string) {
  return runnersFor(capability)[0] ?? null;
}
