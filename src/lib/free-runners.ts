export type FreeRunner = {
  id: string;
  name: string;
  kind: "android" | "public" | "gpu";
  description: string;
  capabilities: string[];
  url: string;
  notes: string;
};

/** No-key execution options. These are links, not paid API integrations. */
export const FREE_RUNNERS: FreeRunner[] = [
  {
    id: "android-local",
    name: "Android / Browser Local",
    kind: "android",
    description: "Browser-capable open models and WebAssembly/WebGPU where practical.",
    capabilities: ["text", "small-audio", "small-image"],
    url: "https://huggingface.co/spaces/Xenova/musicgen-web",
    notes: "Best for lightweight jobs.",
  },
  {
    id: "hf-rvc",
    name: "Hugging Face — Applio/RVC",
    kind: "public",
    description: "Public open voice-conversion Space; no Studio API key.",
    capabilities: ["voice"],
    url: "https://huggingface.co/spaces/IAHispano/ApplioX",
    notes: "Browser workflow; public Space availability applies.",
  },
  {
    id: "hf-video",
    name: "Hugging Face ZeroGPU — Video",
    kind: "public",
    description: "Public Wan/LTX browser Spaces using shared free GPU infrastructure.",
    capabilities: ["video", "image-to-video"],
    url: "https://huggingface.co/spaces/zerogpu-aoti/Wan2.2-14B-Fast",
    notes: "Free accounts have limited daily ZeroGPU quota; no API key.",
  },
  {
    id: "hf-audio",
    name: "Hugging Face — Demucs",
    kind: "public",
    description: "Public open audio-separation Space.",
    capabilities: ["stems"],
    url: "https://huggingface.co/spaces/nakas/Demucs_V4",
    notes: "No Studio API credential.",
  },
  {
    id: "hf-ace-step",
    name: "Hugging Face — ACE-Step 1.5",
    kind: "public",
    description: "Official ACE-Step 1.5 public Gradio Space with shared free GPU infrastructure.",
    capabilities: ["music"],
    url: "https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5",
    notes: "No Studio API key. Availability and free quota are controlled by the public Space.",
  },
  {
    id: "hf-music",
    name: "Hugging Face — MusicGen Web",
    kind: "public",
    description: "In-browser open MusicGen demo.",
    capabilities: ["music"],
    url: "https://huggingface.co/spaces/Xenova/musicgen-web",
    notes: "Useful on Android.",
  },
  {
    id: "kaggle",
    name: "Kaggle Notebooks",
    kind: "gpu",
    description:
      "Free browser GPU notebooks for heavy open-source workloads; separate from Google Colab.",
    capabilities: ["voice", "stems", "video", "image", "music", "training", "text"],
    url: "https://www.kaggle.com/code",
    notes: "Heavy-compute fallback; the Studio needs no Kaggle API key.",
  },
  {
    id: "lightning",
    name: "Lightning AI Studio",
    kind: "gpu",
    description: "Browser development environment with a free tier for open-source workloads.",
    capabilities: ["voice", "stems", "video", "image", "music", "training", "text"],
    url: "https://lightning.ai/studios",
    notes: "Useful when a persistent browser workspace is easier than Colab.",
  },
];

export function runnersFor(capability?: string) {
  if (!capability) return FREE_RUNNERS;
  return FREE_RUNNERS.filter((runner) => runner.capabilities.includes(capability));
}
