type FileLike = File | Blob | string;
type GradioClient = {
  submit: (apiName: string, inputs: unknown) => AsyncIterable<{ type: string; data?: unknown }>;
};
type GradioModule = {
  Client: { connect: (space: string) => Promise<GradioClient> };
};

const GRADIO_CDN = "https://esm.sh/@gradio/client@1.15.2";
let modulePromise: Promise<GradioModule> | null = null;
const clients = new Map<string, Promise<GradioClient>>();

async function loadGradio(): Promise<GradioModule> {
  if (!modulePromise) {
    // Keep the browser runtime dependency free: no npm package or API key is required.
    // @ts-expect-error TypeScript does not resolve browser-native remote ESM URLs.
    modulePromise = import(/* @vite-ignore */ GRADIO_CDN) as Promise<GradioModule>;
  }
  return modulePromise;
}

export function connectFreeSpace(space: string): Promise<GradioClient> {
  let client = clients.get(space);
  if (!client) {
    client = loadGradio().then(({ Client }) => Client.connect(space));
    clients.set(space, client);
  }
  return client;
}

export function freeFile(file: FileLike): FileLike {
  return file;
}

export function outputUrl(value: unknown): string | null {
  if (typeof value === "string" && /^(https?:|blob:|data:)/.test(value)) return value;
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  for (const key of ["url", "path", "data"]) {
    const candidate = item[key];
    if (typeof candidate === "string" && /^(https?:|blob:|data:)/.test(candidate)) return candidate;
  }
  if (item.value) return outputUrl(item.value);
  return null;
}

export function firstOutput(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const data = (result as { data?: unknown }).data;
  return Array.isArray(data) ? data[0] : (data ?? result);
}

export async function runGradio(
  space: string,
  apiName: string,
  inputs: Record<string, unknown> | unknown[],
) {
  const client = await connectFreeSpace(space);
  const job = client.submit(apiName, inputs);
  let latest: unknown = null;
  for await (const message of job) {
    if (message.type === "data") latest = message;
  }
  return firstOutput(latest);
}

export async function runGradioAll(
  space: string,
  apiName: string,
  inputs: Record<string, unknown> | unknown[],
) {
  const client = await connectFreeSpace(space);
  const job = client.submit(apiName, inputs);
  let latest: unknown = null;
  for await (const message of job) {
    if (message.type === "data") latest = message;
  }
  if (!latest || typeof latest !== "object") return [latest];
  const data = (latest as { data?: unknown }).data;
  return Array.isArray(data) ? data : [data ?? latest];
}

export const FREE_SPACE_IDS = {
  music: "victor/ace-step-jam",
  image: "mrfakename/Z-Image-Turbo",
  video: "Wan-AI/Wan-2.2-5B",
  voiceClone: "Qwen/Qwen3-TTS",
  voiceSwap: "Plachta/Seed-VC",
} as const;
