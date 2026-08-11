import { runGradio } from "./gradio-free";
import { freeArtifactUrl } from "./free-artifact";
import { lastSuccessfulFreeSpace } from "./free-artifact-route";

const DEFAULT_SPACES: Record<string, string> = {
  music: "ACE-Step/Ace-Step-v1.5",
  image: "hf-applications/Z-Image-Turbo",
  video: "Lightricks/LTX-2-3",
  voiceClone: "Qwen/Qwen3-TTS",
  voiceSwap: "Plachta/Seed-VC",
};

export async function runFreeMedia(
  logical: "music" | "image" | "video" | "voiceClone" | "voiceSwap",
  input: Record<string, unknown>,
  onStatus?: (message: string) => void,
) {
  const result = await runGradio(logical, "", input, onStatus);
  const space = lastSuccessfulFreeSpace(logical, DEFAULT_SPACES[logical]);
  const url = freeArtifactUrl(result, space);
  if (!url) throw new Error(`${logical} engine returned no usable media artifact.`);
  return { result, url, space };
}
