import { Client, handle_file } from "@gradio/client";

type FileLike = File | Blob | string;
type Inputs = Record<string, unknown> | unknown[];
type EndpointParam = {
  label?: string;
  parameter_name?: string;
  component?: string;
  type?: string;
  default?: unknown;
  optional?: boolean;
};
type EndpointInfo = { parameters?: EndpointParam[]; returns?: unknown[] };
type ApiInfo = {
  named_endpoints?: Record<string, EndpointInfo>;
  unnamed_endpoints?: Record<string, EndpointInfo>;
};
type GradioMessage = { type?: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs?: unknown) => GradioJob;
  predict?: (apiName: string, inputs?: unknown) => Promise<unknown>;
  view_api?: (all_endpoints?: boolean) => Promise<ApiInfo>;
};
type RouteCandidate = { space: string; endpoints: string[]; priority: number };
type RouteHealth = {
  failures: number;
  successes: number;
  nextRetryAt: number;
  lastSuccessAt: number;
  lastFailureAt: number;
  lastError?: string;
};

const CONNECT_TIMEOUT = 30_000;
const API_TIMEOUT = 30_000;
const JOB_TIMEOUT = 12 * 60_000;
const FAILURE_BASE_TTL = 8_000;
const FAILURE_MAX_TTL = 2 * 60_000;
const SUCCESS_TTL = 60_000;
const MAX_ROUTE_RETRIES = 2;

const clients = new Map<string, Promise<GradioClient>>();
const apiCache = new Map<string, { info: ApiInfo; expires: number }>();
const health = new Map<string, RouteHealth>();

const ROUTES: Record<string, RouteCandidate[]> = {
  speechToText: [
    { space: "openai/whisper", endpoints: ["/predict"], priority: 250 },
    { space: "hf-audio/whisper-large-v3", endpoints: ["/predict"], priority: 180 },
  ],
  music: [
    { space: "ASLP-lab/DiffRhythm2", endpoints: ["/infer_music", "/predict"], priority: 250 },
    { space: "victor/ace-step-jam", endpoints: ["/generate", "/create"], priority: 230 },
    { space: "ACE-Step/Ace-Step-v1.5", endpoints: ["/generate_music", "/predict", "/create"], priority: 180 },
  ],
  image: [{ space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image", "/predict"], priority: 250 }],
  video: [
    { space: "Wan-AI/Wan2.2-S2V", endpoints: ["/predict", "/generate_video"], priority: 250 },
    { space: "r3gm/wan2-2-fp8da-aoti-preview", endpoints: ["/generate_video", "/predict"], priority: 200 },
    { space: "zerogpu-aoti/wan2-2-fp8da-aoti-faster", endpoints: ["/generate_video", "/predict"], priority: 180 },
  ],
  voiceClone: [{ space: "Qwen/Qwen3-TTS", endpoints: ["/generate_voice_clone"], priority: 260 }],
  voicePreset: [{ space: "Qwen/Qwen3-TTS", endpoints: ["/generate_custom_voice"], priority: 260 }],
  voiceSwap: [
    { space: "Plachta/Seed-VC", endpoints: ["/convert_voice_v1_wrapper", "/convert_voice_v2_wrapper", "/convert", "/predict"], priority: 240 },
    { space: "r3gm/RVC-Zero", endpoints: ["/convert", "/predict"], priority: 170 },
  ],
  vocalSeparation: [
    { space: "JacobLinCool/vocal-separation", endpoints: ["/inference", "/separate", "/predict"], priority: 240 },
    { space: "owiedotch/demucs-stem-separation", endpoints: ["/inference", "/predict"], priority: 170 },
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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Generation service timed out.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function key(logicalId: string, space: string) {
  return `${logicalId}:${space}`;
}

function getHealth(logicalId: string, space: string): RouteHealth {
  const cacheKey = key(logicalId, space);
  const current = health.get(cacheKey);
  if (current) return current;
  const created: RouteHealth = {
    failures: 0,
    successes: 0,
    nextRetryAt: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
  };
  health.set(cacheKey, created);
  return created;
}

function markHealthy(logicalId: string, space: string) {
  const state = getHealth(logicalId, space);
  state.successes += 1;
  state.failures = 0;
  state.nextRetryAt = 0;
  state.lastSuccessAt = Date.now();
  state.lastError = undefined;
  apiCache.delete(space);
}

function markUnhealthy(logicalId: string, space: string, error: unknown) {
  const state = getHealth(logicalId, space);
  state.failures += 1;
  state.lastFailureAt = Date.now();
  state.lastError = error instanceof Error ? error.message : String(error);
  const delay = Math.min(FAILURE_MAX_TTL, FAILURE_BASE_TTL * 2 ** Math.min(state.failures - 1, 5));
  state.nextRetryAt = Date.now() + delay;
  apiCache.delete(space);
  clients.delete(space);
}

export function connectFreeSpace(space: string) {
  let client = clients.get(space);
  if (!client) {
    client = Client.connect(space) as unknown as Promise<GradioClient>;
    client.catch(() => clients.delete(space));
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
    if (text.startsWith("/file=") || text.startsWith("file=")) return text;
    try {
      if (text.startsWith("{") || text.startsWith("[")) return outputUrl(JSON.parse(text));
    } catch {
      return null;
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
  for (const field of ["url", "blob", "path", "data", "value", "audio", "image", "video", "audio_url", "video_url", "image_url"]) {
    const found = outputUrl(item[field]);
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
  return (value as Record<string, unknown>).data ?? value;
}

function endpointMap(info: ApiInfo): Record<string, EndpointInfo> {
  return { ...(info.named_endpoints ?? {}), ...(info.unnamed_endpoints ?? {}) };
}

function parameterName(param: EndpointParam) {
  return String(param.parameter_name ?? param.label ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickValue(name: string, inputs: Record<string, unknown>, logicalId: string) {
  const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const exact = Object.entries(inputs).find(([inputName]) => normalized(inputName) === name);
  if (exact) return exact[1];

  const aliases: Record<string, string[]> = {
    audio: ["audio", "inputaudio", "sourceaudio", "sourceaudiopath", "audiofile"],
    inputaudio: ["audio", "inputaudio", "sourceaudio"],
    inputimage: ["image", "inputimage", "sourceimage", "imagefile"],
    image: ["image", "inputimage", "sourceimage"],
    prompt: ["prompt", "description", "textprompt", "styleprompt"],
    description: ["description", "prompt"],
    textprompt: ["textprompt", "description", "prompt"],
    text: ["text", "targettext", "prompt"],
    targettext: ["targettext", "text"],
    lyrics: ["lyrics", "lrc"],
    lrc: ["lrc", "lyrics"],
    audioprompt: ["audioprompt"],
    seed: ["seed"],
    randomizeseed: ["randomizeseed"],
    steps: ["steps", "inferstep", "inferencesteps", "diffusionsteps"],
    cfgstrength: ["cfgstrength", "guidancescale"],
    guidance: ["guidancescale", "guidance"],
    guidancescale: ["guidancescale", "guidance"],
    height: ["height"],
    width: ["width"],
    numinferencesteps: ["numinferencesteps", "inference_steps"],
    refaudio: ["refaudio", "referenceaudio", "sourceaudio"],
    reftext: ["reftext", "referencetext"],
    language: ["language"],
    usesvectoronly: ["usesvectoronly"],
    modelsize: ["modelsize"],
    speaker: ["speaker", "voice", "voiceid"],
    instruct: ["instruct", "instruction"],
    sourceaudiopath: ["sourceaudiopath", "sourceaudio", "audio"],
    targetaudiopath: ["targetaudiopath", "targetaudio", "referenceaudio", "refaudio"],
    pitchshift: ["pitchshift"],
    autoadjustf0: ["autoadjustf0", "autof0adjust"],
    f0condition: ["f0condition"],
    input: ["input", "audio", "image"],
  };

  for (const candidate of aliases[name] ?? [name]) {
    const found = Object.entries(inputs).find(([inputName]) => normalized(inputName) === candidate);
    if (found) return found[1];
  }
  if (logicalId === "speechToText" && (name.includes("audio") || name.includes("input"))) return inputs.audio;
  return undefined;
}

async function normalizeInput(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalizeInput));
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([field, item]) => [field, await normalizeInput(item)] as const),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function resolveEndpoint(logicalId: string, route: RouteCandidate, preferred?: string, forceFresh = false) {
  const client = await withTimeout(connectFreeSpace(route.space), CONNECT_TIMEOUT);
  if (!client.view_api) return { client, endpoint: preferred ?? route.endpoints[0], spec: undefined as EndpointInfo | undefined };

  const cached = !forceFresh ? apiCache.get(route.space) : undefined;
  const info = cached && cached.expires > Date.now() ? cached.info : await withTimeout(client.view_api(true), API_TIMEOUT);
  apiCache.set(route.space, { info, expires: Date.now() + SUCCESS_TTL });

  const map = endpointMap(info);
  const candidates = preferred ? [preferred, ...route.endpoints.filter((endpoint) => endpoint !== preferred)] : route.endpoints;
  for (const candidate of candidates) {
    if (map[candidate]) return { client, endpoint: candidate, spec: map[candidate] };
  }
  throw new Error(`No compatible endpoint is exposed by ${route.space}.`);
}

function buildInputs(logicalId: string, spec: EndpointInfo | undefined, inputs: Inputs): unknown {
  if (!spec?.parameters?.length || Array.isArray(inputs)) return inputs;
  const record = inputs as Record<string, unknown>;
  return spec.parameters.map((param) => {
    const name = parameterName(param);
    const supplied = pickValue(name, record, logicalId);
    if (supplied !== undefined) return supplied;
    if (param.default !== undefined) return param.default;
    if (param.optional) return null;
    throw new Error(`Required generation input "${param.parameter_name ?? param.label ?? "unknown"}" is unavailable.`);
  });
}

async function execute(client: GradioClient, endpoint: string, spec: EndpointInfo | undefined, logicalId: string, inputs: Inputs) {
  const normalized = await normalizeInput(buildInputs(logicalId, spec, inputs));
  if (client.predict) {
    try {
      return await withTimeout(client.predict(endpoint, normalized), JOB_TIMEOUT);
    } catch (error) {
      console.warn(`[Buddy] direct prediction failed for ${endpoint}; trying queue`, error);
    }
  }

  const job = client.submit(endpoint, normalized);
  let latest: unknown = null;
  for await (const message of job) {
    if (message.type === "status" && message.status) console.debug("[Buddy] generation status", message.status);
    if (message.type === "data") latest = message.data ?? null;
  }
  if (latest == null) throw new Error("The generation service returned no result.");
  return latest;
}

function usableResult(value: unknown, logicalId: string) {
  const result = firstOutput(value);
  if (logicalId === "speechToText") return typeof result === "string" && result.trim().length > 0;
  return Boolean(outputUrl(result));
}

async function runRoute(logicalId: string, route: RouteCandidate, inputs: Inputs, onStatus?: (message: string) => void, preferred?: string) {
  const state = getHealth(logicalId, route.space);
  if (state.nextRetryAt > Date.now()) throw new Error(`Route cooling down: ${route.space}`);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ROUTE_RETRIES; attempt += 1) {
    try {
      const resolved = await resolveEndpoint(logicalId, route, preferred, attempt > 0);
      const result = await execute(resolved.client, resolved.endpoint, resolved.spec, logicalId, inputs);
      if (!usableResult(result, logicalId)) throw new Error("The selected engine returned no usable result.");
      markHealthy(logicalId, route.space);
      return firstOutput(result);
    } catch (error) {
      lastError = error;
      markUnhealthy(logicalId, route.space, error);
      onStatus?.(attempt === 0 ? "Buddy is repairing that connection…" : "Trying a fresh connection…");
      if (attempt === 0) {
        clients.delete(route.space);
        apiCache.delete(route.space);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Route failed.");
}

export function getFreeRuntimeHealth() {
  return Object.fromEntries(
    [...health.entries()].map(([route, state]) => [route, { ...state, available: state.nextRetryAt <= Date.now() }]),
  );
}

export function resetFreeRuntimeHealth() {
  health.clear();
  apiCache.clear();
  clients.clear();
}

async function collect(logicalId: string, inputs: Inputs, onStatus?: (message: string) => void, preferred?: string) {
  const candidates = [...(ROUTES[logicalId] ?? [])].sort((a, b) => {
    const aState = getHealth(logicalId, a.space);
    const bState = getHealth(logicalId, b.space);
    const aPenalty = aState.nextRetryAt > Date.now() ? 1_000_000 : aState.failures * 10;
    const bPenalty = bState.nextRetryAt > Date.now() ? 1_000_000 : bState.failures * 10;
    return b.priority - bPenalty - (a.priority - aPenalty);
  });
  if (!candidates.length) throw new Error(`No free route is configured for ${logicalId}.`);

  let lastError: unknown = null;
  for (const route of candidates) {
    try {
      onStatus?.("Finding the best available engine…");
      return await runRoute(logicalId, route, inputs, onStatus, preferred);
    } catch (error) {
      lastError = error;
      onStatus?.("Buddy is switching to the best remaining option…");
      console.warn(`[Buddy] ${logicalId} route failed: ${route.space}`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No free public generation route is currently available.");
}

function logicalIdFor(space: string) {
  if (Object.prototype.hasOwnProperty.call(ROUTES, space)) return space;
  const direct = Object.entries(ROUTES).find(([, routes]) => routes.some((route) => route.space === space));
  return direct?.[0] ?? Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "";
}

export async function probeFreeRoute(logicalId: string): Promise<boolean> {
  const candidates = [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority);
  for (const route of candidates) {
    try {
      await resolveEndpoint(logicalId, route, undefined, true);
      markHealthy(logicalId, route.space);
      return true;
    } catch (error) {
      markUnhealthy(logicalId, route.space, error);
    }
  }
  return false;
}

export async function runGradio(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) {
  const logicalId = logicalIdFor(space);
  if (!logicalId) throw new Error(`Unknown free generation service: ${space}`);
  return collect(logicalId, inputs, onStatus, apiName || undefined);
}

export async function runGradioAll(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) {
  const result = await runGradio(space, apiName, inputs, onStatus);
  return Array.isArray(result) ? result : [result];
}
