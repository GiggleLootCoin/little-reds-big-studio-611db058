function extractArtifact(value: unknown): string | null {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    if (
      /^(https?:|blob:|data:|\/gradio_api\/file=|\/file=|file=|\/tmp\/|\/home\/|\/data\/)/.test(
        text,
      )
    )
      return text;
    try {
      if (text.startsWith("{") || text.startsWith("[")) return extractArtifact(JSON.parse(text));
    } catch {
      return null;
    }
    return null;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractArtifact(item);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  // Gradio FileData normally contains both `path` and a browser-usable `url`.
  // Prefer the URL because `path` can be a private server filesystem path.
  for (const key of [
    "url",
    "blob",
    "data",
    "value",
    "file",
    "audio",
    "image",
    "video",
    "audio_url",
    "image_url",
    "video_url",
  ]) {
    const found = extractArtifact(record[key]);
    if (found) return found;
  }
  const path = record.path;
  if (
    typeof path === "string" &&
    /^(https?:|blob:|data:|\/gradio_api\/file=|\/file=|file=|\/tmp\/|\/home\/|\/data\/)/.test(path)
  )
    return path;
  return null;
}

/**
 * Hugging Face Space hostnames use a DNS-safe slug: owner and space name are
 * joined with hyphens and punctuation such as dots is also converted to '-'.
 * Keeping this normalization in one place is critical for Spaces such as
 * ACE-Step/Ace-Step-v1.5, where a literal dot produces an invalid host.
 */
export function freeSpaceOrigin(space: string) {
  const slug = space
    .replace(/^https?:\/\/huggingface\.co\/spaces\//, "")
    .replace(/^spaces\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `https://${slug}.hf.space`;
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
  if (trimmed.startsWith("/tmp/") || trimmed.startsWith("/home/") || trimmed.startsWith("/data/"))
    return `${origin}/gradio_api/file=${trimmed}`;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/gradio_api/file=/${trimmed}`;
}

export function freeArtifactUrl(value: unknown, space: string) {
  const url = extractArtifact(value);
  if (!url) return null;
  return normalizeGradioFileUrl(url, space);
}
