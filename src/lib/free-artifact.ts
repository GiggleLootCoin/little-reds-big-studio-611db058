import { outputUrl } from "./gradio-free";

export function freeSpaceOrigin(space: string) {
  return `https://${space.replace(/\//g, "-").toLowerCase()}.hf.space`;
}

function normalizeArtifactSpace(space: string) {
  // The former Wan S2V Space delegates generation to DashScope and therefore
  // is not a valid no-cost/no-key foundation. Keep old callers compatible by
  // resolving their relative Gradio artifacts against the free LTX worker.
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
