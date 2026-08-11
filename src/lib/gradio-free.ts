export {
  FREE_SPACE_IDS,
  connectFreeSpace,
  freeFile,
  getFreeRuntimeHealth,
  runGradio,
  runGradioAll,
} from "./gradio-free-v2";

export async function firstOutput(value: unknown) {
  if (Array.isArray(value)) return value.find((item) => item != null && hasOutput(item)) ?? null;
  return hasOutput(value) ? value : null;
}

function hasOutput(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.size > 0;
  if (Array.isArray(value)) return value.some(hasOutput);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasOutput);
  return true;
}

export function outputUrl(value: unknown): string | null {
  if (
    typeof value === "string" &&
    /^(https?:\\/\\/|blob:|data:|\\/gradio_api\\/file=|\\/file=|file=)/i.test(value)
  )
    return value;
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = outputUrl(item);
      if (url) return url;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const url = outputUrl(item);
      if (url) return url;
    }
  }
  return null;
}
