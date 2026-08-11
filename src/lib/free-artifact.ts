import { outputUrl } from "./gradio-free";

export function freeSpaceOrigin(space: string) {
  return `https://${space.replace(/\//g, "-").toLowerCase()}.hf.space`;
}

function normalizeArtifactSpace(space: string) {
  if (space === "Wan-AI/Wan2.2-S2V") return "Lightricks/LTX-2-3";
  return space;
}

function normalizeGradioFileUrl(url: string, space: string) {
  const trimmed = url.trim();
  if (/^(https?:|blob:|data:)/.test(trimmed)) return trimmed;
  const origin = freeSpaceOrigin(normalizeArtifactSpace(space));
  if (trimmed.startsWith("/gradio_api/file=")) return `${origin}${trimmed}`;
  if (trimmed.startsWith("gradio_api/file=")) return `${origin}/${trimmed}`;
  if (trimmed.startsWith("/file=")) return `${origin}/gradio_api${trimmed}`;
  if (trimmed.startsWith("file=")) return `${origin}/gradio_api/${trimmed}`;
  if (trimmed.startsWith("/tmp/") || trimmed.startsWith("/home/") || trimmed.startsWith("/data/")) return `${origin}/gradio_api/file=${trimmed}`;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/gradio_api/file=/${trimmed}`;
}

export function freeArtifactUrl(value: unknown, space: string) {
  const url = outputUrl(value);
  if (!url) return null;
  return normalizeGradioFileUrl(url, space);
}
