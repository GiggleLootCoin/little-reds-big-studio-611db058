import { Client, handle_file } from "@gradio/client";

type FileLike = File | Blob | string;
type GradioMessage = { type: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs?: unknown) => GradioJob;
  predict?: (apiName: string, inputs?: unknown) => Promise<unknown>;
  view_api?: (allEndpoints?: boolean) => Promise<unknown>;
};
type RouteCandidate = { space: string; endpoints: string[]; priority: number };

const ROUTE_TTL = 5 * 60_000;
const CONNECT_TIMEOUT = 45_000;
const JOB_TIMEOUT = 8 * 60_000;
const clients = new Map<string, Promise<GradioClient>>();
const routeCache = new Map<string, { ok: boolean; expires: number }>();

const ROUTES: Record<string, RouteCandidate[]> = {
  speechToText: [
    { space: "hf-audio/whisper-large-v3-turbo", endpoints: ["/predict"], priority: 180 },
    { space: "hf-audio/whisper-large-v3", endpoints: ["/transcribe", "/predict"], priority: 160 },
    { space: "Qwen/Qwen3-ASR", endpoints: ["/transcribe", "/predict"], priority: 150 },
  ],
  music: [
    { space: "victor/ace-step-jam", endpoints: ["/generate", "/create"], priority: 180 },
    { space: "ASLP-lab/DiffRhythm2", endpoints: ["/infer_music", "/predict"], priority: 170 },
    { space: "ACE-Step/Ace-Step-v1.5", endpoints: ["/generate_music", "/predict", "/create"], priority: 150 },
  ],
  image: [
    { space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 180 },
    { space: "hf-applications/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 140 },
  ],
  video: [
    { space: "Wan-AI/Wan2.2-S2V", endpoints: ["/predict", "/generate_video"], priority: 180 },
    { space: "dream2589632147/Dream-wan2-2-faster-Pro", endpoints: ["/generate_video", "/predict"], priority: 160 },
  ],
  voiceClone: [
    { space: "Qwen/Qwen3-TTS", endpoints: ["/generate_voice_clone"], priority: 220 },
    { space: "multimodalart/higgs-audio-v3-tts", endpoints: ["/synthesize"], priority: 160 },
  ],
  voicePreset: [
    { space: "Qwen/Qwen3-TTS", endpoints: ["/generate_custom_voice"], priority: 220 },
    { space: "hexgrad/Kokoro-TTS", endpoints: ["/generate", "/predict"], priority: 160 },
  ],
  voiceSwap: [
    { space: "Plachta/Seed-VC", endpoints: ["/convert_voice_v1_wrapper", "/convert_voice_v2_wrapper", "/convert"], priority: 180 },
    { space: "r3gm/RVC-Zero", endpoints: ["/convert", "/predict"], priority: 140 },
  ],
  vocalSeparation: [
    { space: "JacobLinCool/vocal-separation", endpoints: ["/inference", "/separate", "/predict"], priority: 180 },
    { space: "owiedotch/demucs-stem-separation", endpoints: ["/inference", "/predict"], priority: 160 },
  ],
};

export const FREE_SPACE_IDS = {
  speechToText: "speechToText",
  music: "music",
  image: "image",
  video: "video",
  voiceClone: "voiceClone",
  voicePreset: "voicePreset",
  voiceSwap: "voiceSwap",
  vocalSeparation: "vocalSeparation",
} as const;

export function connectFreeSpace(space: string) {
  let client = clients.get(space);
  if (!client) {
    client = Client.connect(space) as unknown as Promise<GradioClient>;
    clients.set(space, client);
  }
  return client;
}

export function freeFile(file: FileLike): FileLike {
  return file;
}

export function outputUrl(value: unknown): string | null {
  if (typeof value === "string") {
    const s = value.trim();
    if (/^(https?:|blob:|data:)/.test(s)) return s;
    if (s.startsWith("/file=")) return s;
    if (s.startsWith("{") || s.startsWith("[")) {
      try { return outputUrl(JSON.parse(s)); } catch { return null; }
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = outputUrl(item);
      if (found) return found;
    }
    return null;
  }
  const item = value as Record<string, unknown>;
  for (const key of ["url", "path", "data", "value", "audio", "image", "video", "audio_url", "video_url", "image_url"]) {
    const found = outputUrl(item[key]);
    if (found) return found;
  }
  return null;
}

export function firstOutput(value: unknown): unknown {
  if (typeof value === "string") {
    try { return firstOutput(JSON.parse(value)); } catch { return value; }
  }
  if (!value || typeof value !== "object") return value;
  return (value as { data?: unknown }).data ?? value;
}

function endpointNames(info: unknown): string[] {
  if (!info || typeof info !== "object") return [];
  const record = info as Record<string, unknown>;
  for (const key of ["named_endpoints", "unnamed_endpoints"]) {
    const group = record[key];
    if (group && typeof group === "object") return Object.keys(group);
  }
  return Object.keys(record).filter((key) => key.startsWith("/"));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("Timed out.")), ms); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveEndpoint(route: RouteCandidate, preferredEndpoint?: string) {
  const client = await withTimeout(connectFreeSpace(route.space), CONNECT_TIMEOUT);
  if (!client.view_api) return { client, endpoint: preferredEndpoint ?? route.endpoints[0] };
  const info = await withTimeout(client.view_api(true), CONNECT_TIMEOUT);
  const available = endpointNames(info);
  const candidates = preferredEndpoint ? [preferredEndpoint, ...route.endpoints.filter((x) => x !== preferredEndpoint)] : route.endpoints;
  const endpoint = candidates.find((x) => available.includes(x));
  if (!endpoint) throw new Error(`No compatible endpoint is currently exposed by ${route.space}.`);
  return { client, endpoint };
}

async function normalizeInput(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalizeInput));
  if (value && typeof value === "object" && !(value instanceof Blob)) {
    const entries = await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await normalizeInput(item)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

function adaptInputs(logicalId: string, space: string, endpoint: string, inputs: Record<string, unknown> | unknown[]) {
  if (logicalId === "speechToText") {
    const audio = Array.isArray(inputs)
      ? inputs[0]
      : ((inputs as Record<string, unknown>).audio ?? (inputs as Record<string, unknown>).inputs);
    return { inputs: audio, task: "transcribe" };
  }
  if (logicalId === "voicePreset" && space === "Qwen/Qwen3-TTS" && endpoint === "/generate_custom_voice") {
    const values = Array.isArray(inputs) ? inputs : [];
    const text = String(values[0] ?? "Hello from Buddy.");
    const requested = String(values[1] ?? "Ryan");
    const speakers = new Set(["Aiden", "Dylan", "Eric", "Ono_anna", "Ryan", "Serena", "Sohee", "Uncle_fu", "Vivian"]);
    const speaker = speakers.has(requested) ? requested : "Ryan";
    return [text, "English", speaker, "", "1.7B"];
  }
  if (logicalId === "voiceClone" && space === "Qwen/Qwen3-TTS" && endpoint === "/generate_voice_clone") {
    const values = Array.isArray(inputs) ? inputs : [];
    return [values[0], String(values[1] ?? ""), String(values[2] ?? "Hello from Buddy."), String(values[3] ?? "English"), Boolean(values[4] ?? true), String(values[5] ?? "1.7B")];
  }
  if (logicalId === "music" && space === "victor/ace-step-jam" && endpoint === "/generate" && !Array.isArray(inputs)) {
    return { prompt: String(inputs.description ?? inputs.prompt ?? "polished original song"), lyrics: String(inputs.lyrics ?? ""), audio_duration: Number(inputs.audio_duration ?? 120), infer_step: 8, guidance_scale: 7, seed: Number(inputs.seed ?? -1), lora_name_or_path: "", lora_weight: 0.8 };
  }
  if (logicalId === "music" && space === "victor/ace-step-jam" && endpoint === "/create" && !Array.isArray(inputs)) {
    return { description: String(inputs.description ?? "polished modern song"), audio_duration: Number(inputs.audio_duration ?? 120), seed: Number(inputs.seed ?? -1), community: false };
  }
  if (logicalId === "music" && space === "ASLP-lab/DiffRhythm2" && endpoint === "/infer_music" && !Array.isArray(inputs)) {
    return { lrc: String(inputs.lyrics ?? inputs.lrc ?? ""), current_prompt_type: "text", audio_prompt: null, text_prompt: String(inputs.description ?? inputs.prompt ?? "polished original song"), seed: Number(inputs.seed ?? 42), randomize_seed: true, steps: 16, cfg_strength: 1.3, file_type: "wav", odeint_method: "euler" };
  }
  return inputs;
}

async function submitJob(client: GradioClient, endpoint: string, inputs: unknown) {
  const normalized = await normalizeInput(inputs);
  if (client.predict) {
    try { return await withTimeout(client.predict(endpoint, normalized), JOB_TIMEOUT); } catch { /* queue retry */ }
  }
  const job = client.submit(endpoint, normalized);
  let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The creation service returned no result.");
  return latest;
}

export async function probeFreeRoute(logicalId: string): Promise<boolean> {
  for (const route of [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority)) {
    const key = `${logicalId}:${route.space}`;
    const cached = routeCache.get(key);
    if (cached && cached.expires > Date.now()) { if (cached.ok) return true; continue; }
    try { await resolveEndpoint(route); routeCache.set(key, { ok: true, expires: Date.now() + ROUTE_TTL }); return true; }
    catch { routeCache.set(key, { ok: false, expires: Date.now() + 30_000 }); }
  }
  return false;
}

async function collect(logicalId: string, inputs: Record<string, unknown> | unknown[], onStatus?: (message: string) => void, preferredEndpoint?: string) {
  const candidates = [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority);
  if (!candidates.length) throw new Error(`No free route is configured for ${logicalId}.`);
  let lastError: unknown = null;
  for (const route of candidates) {
    const key = `${logicalId}:${route.space}`;
    const cached = routeCache.get(key);
    if (cached && cached.expires > Date.now() && !cached.ok) continue;
    try {
      onStatus?.("Finding the best available engine…");
      const { client, endpoint } = await resolveEndpoint(route, preferredEndpoint);
      routeCache.set(key, { ok: true, expires: Date.now() + ROUTE_TTL });
      const result = await submitJob(client, endpoint, adaptInputs(logicalId, route.space, endpoint, inputs));
      const unwrapped = firstOutput(result);
      if (unwrapped == null) throw new Error("The selected engine returned no result.");
      return unwrapped;
    } catch (error) {
      lastError = error;
      routeCache.set(key, { ok: false, expires: Date.now() + 30_000 });
      onStatus?.("That engine is unavailable; Buddy is switching automatically…");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No free public generation route is currently available.");
}

export async function runGradio(space: string, apiName: string, inputs: Record<string, unknown> | unknown[], onStatus?: (message: string) => void) {
  const logicalId = Object.prototype.hasOwnProperty.call(ROUTES, space) ? space : (Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "");
  if (!logicalId) throw new Error(`Unknown free generation service: ${space}`);
  return firstOutput(await collect(logicalId, inputs, onStatus, apiName));
}

export async function runGradioAll(space: string, apiName: string, inputs: Record<string, unknown> | unknown[], onStatus?: (message: string) => void) {
  const logicalId = Object.prototype.hasOwnProperty.call(ROUTES, space) ? space : (Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "");
  if (!logicalId) throw new Error(`Unknown free generation service: ${space}`);
  const latest = await collect(logicalId, inputs, onStatus, apiName);
  if (Array.isArray(latest)) return latest;
  if (latest && typeof latest === "object" && Array.isArray((latest as { data?: unknown }).data)) return (latest as { data: unknown[] }).data;
  return [firstOutput(latest)];
}
