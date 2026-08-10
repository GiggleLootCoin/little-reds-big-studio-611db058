import { outputUrl } from "./gradio-free";

export function freeSpaceOrigin(space: string) {
  return `https://${space.replace(/\//g, "-").toLowerCase()}.hf.space`;
}

export function freeArtifactUrl(value: unknown, space: string) {
  const url = outputUrl(value);
  if (!url) return null;
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  try {
    return new URL(url.startsWith("/") ? url : `/${url}`, freeSpaceOrigin(space)).toString();
  } catch {
    return null;
  }
}
