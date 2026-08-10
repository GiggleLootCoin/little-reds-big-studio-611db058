type FileLike = File | Blob | string;
type GradioClient = {
  submit: (apiName: string, inputs: unknown) => AsyncIterable<{ type: string; data?: unknown }>;
};
type GradioModule = { Client: { connect: (space: string) => Promise<GradioClient> } };

const GRADIO_CDN = "https://esm.sh/@gradio/client@1.17.0";
let modulePromise: Promise<GradioModule> | null = null;
const clients = new Map<string, Promise<GradioClient>>();

async function loadGradio(): Promise<GradioModule> {
  if (!modulePromise) modulePromise = import(/* @vite-ignore */ GRADIO_CDN) as Promise<GradioModule>;
  return modulePromise;
}
export function connectFreeSpace(space: string) { let client = clients.get(space); if (!client) { client = loadGradio().then(({ Client }) => Client.connect(space)); clients.set(space, client); } return client; }
export function freeFile(file: FileLike): FileLike { return file; }

export function outputUrl(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^(https?:|blob:|data:)/.test(trimmed)) return trimmed;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { return outputUrl(JSON.parse(trimmed)); } catch {}
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) { for (const item of value) { const found = outputUrl(item); if (found) return found; } return null; }
  const item = value as Record<string, unknown>;
  for (const key of ["url", "data", "value", "audio_url", "video_url", "image_url"]) {
    const found = outputUrl(item[key]);
    if (found) return found;
  }
  return null;
}

export function firstOutput(result: unknown): unknown {
  if (typeof result === "string") { try { const parsed = JSON.parse(result); return firstOutput(parsed); } catch { return result; } }
  if (!result || typeof result !== "object") return result;
  const data = (result as { data?: unknown }).data;
  return Array.isArray(data) ? data : (data ?? result);
}

async function collect(space: string, apiName: string, inputs: Record<string, unknown> | unknown[]) {
  const client = await connectFreeSpace(space);
  const job = client.submit(apiName, inputs);
  let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The creation service returned no result.");
  return latest;
}

export async function runGradio(space: string, apiName: string, inputs: Record<string, unknown> | unknown[]) { return firstOutput(await collect(space, apiName, inputs)); }
export async function runGradioAll(space: string, apiName: string, inputs: Record<string, unknown> | unknown[]) {
  const latest = await collect(space, apiName, inputs);
  const first = firstOutput(latest);
  if (Array.isArray(latest)) return latest;
  if (latest && typeof latest === "object" && Array.isArray((latest as any).data)) return (latest as any).data;
  return Array.isArray(first) ? first : [first];
}

export const FREE_SPACE_IDS = {
  music: "victor/ace-step-jam",
  image: "mrfakename/Z-Image-Turbo",
  video: "Wan-AI/Wan-2.2-5B",
  voiceClone: "Qwen/Qwen3-TTS",
  voiceSwap: "Plachta/Seed-VC",
} as const;
