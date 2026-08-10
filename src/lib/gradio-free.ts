import { Client, handle_file } from "@gradio/client";

type FileLike = File | Blob | string;
type Inputs = Record<string, unknown> | unknown[];
type GradioMessage = { type?: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs?: unknown) => GradioJob;
  predict?: (apiName: string, inputs?: unknown) => Promise<unknown>;
  view_api?: (allEndpoints?: boolean) => Promise<unknown>;
};
type RouteCandidate = { space: string; endpoints: string[]; priority: number };

const CONNECT_TIMEOUT = 45_000;
const JOB_TIMEOUT = 8 * 60_000;
const ROUTE_TTL = 5 * 60_000;
const clients = new Map<string, Promise<GradioClient>>();
const routeCache = new Map<string, { ok: boolean; expires: number }>();

const ROUTES: Record<string, RouteCandidate[]> = {
  speechToText: [
    { space: "hf-audio/whisper-large-v3-turbo", endpoints: ["/predict"], priority: 190 },
    { space: "Qwen/Qwen3-ASR", endpoints: ["/transcribe", "/predict"], priority: 180 },
    { space: "hf-audio/whisper-large-v3", endpoints: ["/transcribe", "/predict"], priority: 170 },
  ],
  music: [
    { space: "ASLP-lab/DiffRhythm2", endpoints: ["/infer_music", "/predict"], priority: 200 },
    { space: "victor/ace-step-jam", endpoints: ["/generate", "/create"], priority: 190 },
    { space: "ACE-Step/Ace-Step-v1.5", endpoints: ["/generate_music", "/predict", "/create"], priority: 170 },
  ],
  image: [
    { space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 200 },
    { space: "hf-applications/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 150 },
  ],
  video: [
    { space: "Wan-AI/Wan2.2-S2V", endpoints: ["/predict", "/generate_video"], priority: 200 },
    { space: "dream2589632147/Dream-wan2-2-faster-Pro", endpoints: ["/generate_video", "/predict"], priority: 180 },
  ],
  voiceClone: [{ space: "Qwen/Qwen3-TTS", endpoints: ["/generate_voice_clone"], priority: 220 }],
  voicePreset: [
    { space: "Qwen/Qwen3-TTS", endpoints: ["/generate_custom_voice"], priority: 220 },
    { space: "hexgrad/Kokoro-TTS", endpoints: ["/generate", "/predict"], priority: 160 },
  ],
  voiceSwap: [
    { space: "Plachta/Seed-VC", endpoints: ["/convert_voice_v1_wrapper", "/convert_voice_v2_wrapper", "/convert"], priority: 200 },
    { space: "r3gm/RVC-Zero", endpoints: ["/convert", "/predict"], priority: 160 },
  ],
  vocalSeparation: [
    { space: "JacobLinCool/vocal-separation", endpoints: ["/inference", "/separate", "/predict"], priority: 200 },
    { space: "owiedotch/demucs-stem-separation", endpoints: ["/inference", "/predict"], priority: 180 },
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
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (typeof value === "string") {
    const text = value.trim();
    if (/^(https?:|blob:|data:)/.test(text)) return text;
    if (text.startsWith("/file=")) return text;
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return outputUrl(JSON.parse(text));
      } catch {
        return null;
      }
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
  for (const key of ["url", "blob", "path", "data", "value", "audio", "image", "video", "audio_url", "video_url", "image_url"]) {
    const found = outputUrl(item[key]);
    if (found) return found;
  }
  return null;
}

export function firstOutput(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return firstOutput(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (!value || typeof value !== "object") return value;
  return (value as { data?: unknown }).data ?? value;
}

function endpointNames(info: unknown): string[] {
  if (!info || typeof info !== "object") return [];
  const record = info as Record<string, unknown>;
  const names: string[] = [];
  for (const key of ["named_endpoints", "unnamed_endpoints"]) {
    const group = record[key];
    if (group && typeof group === "object") names.push(...Object.keys(group));
  }
  return names.length ? names : Object.keys(record).filter((key) => key.startsWith("/"));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Generation timed out.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveEndpoint(route: RouteCandidate, preferred?: string) {
  const client = await withTimeout(connectFreeSpace(route.space), CONNECT_TIMEOUT);
  if (!client.view_api) return { client, endpoint: preferred ?? route.endpoints[0] };
  const info = await withTimeout(client.view_api(true), CONNECT_TIMEOUT);
  const available = endpointNames(info);
  const candidates = preferred
    ? [preferred, ...route.endpoints.filter((endpoint) => endpoint !== preferred)]
    : route.endpoints;
  const endpoint = candidates.find((candidate) => available.includes(candidate));
  if (!endpoint) throw new Error(`No compatible endpoint is exposed by ${route.space}.`);
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

function adaptInputs(logicalId: string, space: string, endpoint: string, inputs: Inputs): Inputs {
  if (logicalId === "speechToText") {
    const audio = Array.isArray(inputs) ? inputs[0] : inputs.audio ?? inputs.inputs;
    return [audio];
  }
  if (logicalId === "music" && space === "ASLP-lab/DiffRhythm2" && endpoint === "/infer_music" && !Array.isArray(inputs)) {
    return {
      lrc: String(inputs.lyrics ?? inputs.lrc ?? "[00:00.00] Instrumental idea"),
      current_prompt_type: "text",
      audio_prompt: null,
      text_prompt: String(inputs.description ?? inputs.prompt ?? "polished original song"),
      seed: Number(inputs.seed ?? 42),
      randomize_seed: true,
      steps: 16,
      cfg_strength: 1.3,
      file_type: "wav",
      odeint_method: "euler",
    };
  }
  if (logicalId === "music" && space === "victor/ace-step-jam" && endpoint === "/generate" && !Array.isArray(inputs)) {
    return {
      prompt: String(inputs.description ?? inputs.prompt ?? "polished original song"),
      lyrics: String(inputs.lyrics ?? ""),
      audio_duration: Number(inputs.audio_duration ?? 120),
      infer_step: 8,
      guidance_scale: 7,
      seed: Number(inputs.seed ?? -1),
      lora_name_or_path: "",
      lora_weight: 0.8,
    };
  }
  if (logicalId === "music" && space === "victor/ace-step-jam" && endpoint === "/create" && !Array.isArray(inputs)) {
    return {
      description: String(inputs.description ?? "polished modern song"),
      audio_duration: Number(inputs.audio_duration ?? 120),
      seed: Number(inputs.seed ?? -1),
      community: false,
    };
  }
  if (logicalId === "image" && space === "mrfakename/Z-Image-Turbo" && endpoint === "/generate_image" && !Array.isArray(inputs)) {
    return {
      prompt: String(inputs.prompt ?? "cinematic premium album artwork"),
      height: Number(inputs.height ?? 1024),
      width: Number(inputs.width ?? 1024),
      num_inference_steps: Number(inputs.num_inference_steps ?? 9),
      seed: Number(inputs.seed ?? 42),
      randomize_seed: Boolean(inputs.randomize_seed ?? true),
    };
  }
  if (logicalId === "voicePreset" && space === "Qwen/Qwen3-TTS" && endpoint === "/generate_custom_voice") {
    const values = Array.isArray(inputs) ? inputs : [];
    const speakers = new Set(["Aiden", "Dylan", "Eric", "Ono_anna", "Ryan", "Serena", "Sohee", "Uncle_fu", "Vivian"]);
    return [String(values[0] ?? "Hello from Buddy."), "English", speakers.has(String(values[1])) ? String(values[1]) : "Ryan", "", "1.7B"];
  }
  if (logicalId === "voiceClone" && space === "Qwen/Qwen3-TTS" && endpoint === "/generate_voice_clone") {
    const values = Array.isArray(inputs) ? inputs : [];
    return [values[0], String(values[1] ?? ""), String(values[2] ?? "Hello from Buddy."), String(values[3] ?? "English"), Boolean(values[4] ?? true), String(values[5] ?? "1.7B")];
  }
  return inputs;
}

async function execute(client: GradioClient, endpoint: string, inputs: unknown) {
  const normalized = await normalizeInput(inputs);
  if (client.predict) {
    try {
      return await withTimeout(client.predict(endpoint, normalized), JOB_TIMEOUT);
    } catch {
      // Queue-only Spaces need submit() instead.
    }
  }
  const job = client.submit(endpoint, normalized);
  let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The generation service returned no result.");
  return latest;
}

async function collect(logicalId: string, inputs: Inputs, onStatus?: (message: string) => void, preferred?: string) {
  const candidates = [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority);
  if (!candidates.length) throw new Error(`No free route is configured for ${logicalId}.`);
  let lastError: unknown = null;
  for (const route of candidates) {
    const cacheKey = `${logicalId}:${route.space}`;
    const cached = routeCache.get(cacheKey);
    if (cached && cached.expires > Date.now() && !cached.ok) continue;
    try {
      onStatus?.("Finding the best available engine…");
      const { client, endpoint } = await resolveEndpoint(route, preferred);
      const result = firstOutput(await execute(client, endpoint, adaptInputs(logicalId, route.space, endpoint, inputs)));
      if (result == null) throw new Error("The selected engine returned no result.");
      routeCache.set(cacheKey, { ok: true, expires: Date.now() + ROUTE_TTL });
      return result;
    } catch (error) {
      lastError = error;
      routeCache.set(cacheKey, { ok: false, expires: Date.now() + 30_000 });
      onStatus?.("That engine is unavailable; Buddy is switching automatically…");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No free public generation route is currently available.");
}

function logicalIdFor(space: string) {
  if (Object.prototype.hasOwnProperty.call(ROUTES, space)) return space;
  return Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "";
}

export async function probeFreeRoute(logicalId: string): Promise<boolean> {
  for (const route of [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority)) {
    try {
      await resolveEndpoint(route);
      routeCache.set(`${logicalId}:${route.space}`, { ok: true, expires: Date.now() + ROUTE_TTL });
      return true;
    } catch {
      routeCache.set(`${logicalId}:${route.space}`, { ok: false, expires: Date.now() + 30_000 });
    }
  }
  return false;
}

export async function runGradio(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) {
  const logicalId = logicalIdFor(space);
  if (!logicalId) throw new Error(`Unknown free generation service: ${space}`);
  return collect(logicalId, inputs, onStatus, apiName);
}

export async function runGradioAll(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) {
  const logicalId = logicalIdFor(space);
  if (!logicalId) throw new Error(`Unknown free generation service: ${space}`);
  const result = await collect(logicalId, inputs, onStatus, apiName);
  return Array.isArray(result) ? result : [result];
}
