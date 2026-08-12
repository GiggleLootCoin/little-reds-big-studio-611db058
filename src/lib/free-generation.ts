import { runGradio } from "./gradio-free";
import { freeArtifactUrl } from "./free-artifact";
import { lastSuccessfulFreeSpace } from "./free-artifact-route";
import { markProviderFailure } from "./free-provider-policy";

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
  // Always let the quality-ranked live Gradio pool choose the strongest
  // currently compatible engine first. Do not put a weaker generic image
  // service ahead of the Z-Image/other live quality-ranked routes.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await runGradio(logical, "", input, onStatus);
      const space = lastSuccessfulFreeSpace(logical, DEFAULT_SPACES[logical]);
      const url = freeArtifactUrl(result, space);
      if (url) return { result, url, space };
      const providerId = `${logical}:${space}`;
      markProviderFailure(providerId, new Error("Provider returned no usable media artifact."));
      lastError = new Error(`${space} returned no usable ${logical} artifact.`);
      onStatus?.("That route returned no usable media; Buddy is trying the next quality-ranked free engine…");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${logical} engine returned no usable media artifact.`);
}
