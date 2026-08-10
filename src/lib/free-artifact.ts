import { outputUrl } from "./gradio-free";

export function freeSpaceOrigin(space: string) {
  return `https://${space.replace(/\//g, "-").toLowerCase()}.hf.space`;
}

export function freeArtifactUrl(value: unknown, space: string) {
  const url = outputUrl(value, space);
  if (url) return url;
  if (typeof value !== "string") return null;
  try {
    const text = value.trim();
    if (!text) return null;
    if (/^(https?:|blob:|data:)/.test(text)) return text;
    return new URL(text.startsWith("/") ? text : `/${text}`, freeSpaceOrigin(space)).toString();
  } catch {
    return null;
  }
}
