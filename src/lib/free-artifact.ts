import { outputUrl } from "./gradio-free";

export function freeSpaceOrigin(space: string) {
  return `https://${space.replace(/\//g, "-").toLowerCase()}.hf.space`;
}

function normalizeArtifactSpace(space: string) {
  // Keep compatibility with any legacy caller while ensuring the retired
  // Wan route can only resolve to the current free LTX artifact host.
  if (space === "Wan-AI/Wan2.2-S2V") return "Lightricks/LTX-2-3";
  return space;
}

export function freeArtifactUrl(value: unknown, space: string) {
  const url = outputUrl(value);
  if (!url) return null;
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  try {
    return new URL(url.startsWith("/") ? url : `/${url}`, freeSpaceOrigin(normalizeArtifactSpace(space))).toString();
  } catch {
    return null;
  }
}
