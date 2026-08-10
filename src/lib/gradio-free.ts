import { Client, handle_file } from "@gradio/client";

type FileLike = File | Blob | string;
type Inputs = Record<string, unknown> | unknown[];
type EndpointParam = { label?: string; parameter_name?: string; component?: string; type?: string; default?: unknown; optional?: boolean };
type EndpointInfo = { parameters?: EndpointParam[]; returns?: unknown[] };
type ApiInfo = { named_endpoints?: Record<string, EndpointInfo>; unnamed_endpoints?: Record<string, EndpointInfo> };
type GradioMessage = { type?: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs?: unknown) => GradioJob;
  predict?: (apiName: string, inputs?: unknown) => Promise<unknown>;
  view_api?: (all_endpoints?: boolean) => Promise<ApiInfo>;
};
type RouteCandidate = { space: string; endpoints: string[]; priority: number };

const CONNECT_TIMEOUT = 45_000;
const JOB_TIMEOUT = 12 * 60_000;
const FAIL_TTL = 30_000;
const OK_TTL = 5 * 60_000;
const clients = new Map<string, Promise<GradioClient>>();
const routeCache = new Map<string, { ok: boolean; expires: number }>();

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
  image: [
    { space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image", "/predict"], priority: 250 },
  ],
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
  const record = value as Record<string, unknown>;
  return record.data ?? value;
}

function endpointMap(info: ApiInfo): Record<string, EndpointInfo> {
  return { ...(info.named_endpoints ?? {}), ...(info.unnamed_endpoints ?? {}) };
}

function parameterName(param: EndpointParam) {
  return String(param.parameter_name ?? param.label ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickValue(name: string, inputs: Record<string, unknown>, logicalId: string) {
  const exact = Object.entries(inputs).find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === name);
  if (exact) return exact[1];
  const aliases: Record<string, string[]> = {
    audio: ["audio", "inputaudio", "sourceaudio", "sourceaudiopath", "audiofile"],
    inputaudio: ["audio", "inputaudio", "sourceaudio"],
    inputimage: ["image", "inputimage", "sourceimage", "imagefile"],
    image: ["image", "inputimage", "sourceimage"],
    lastimage: ["lastimage"],
    prompt: ["prompt", "description", "textprompt", "styleprompt"],
    description: ["description", "prompt"],
    textprompt: ["textprompt", "description", "prompt"],
    text: ["text", "targettext", "prompt"],
    targettext: ["targettext", "text"],
    lyrics: ["lyrics", "lrc"],
    lrc: ["lrc", "lyrics"],
    currentprompttype: ["currentprompttype"],
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
  const candidates = aliases[name] ?? [name];
  for (const candidate of candidates) {
    const found = Object.entries(inputs).find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === candidate);
    if (found) return found[1];
  }
  if (logicalId === "speechToText" && (name.includes("audio") || name.includes("input"))) return inputs.audio;
  return undefined;
}

async function normalizeInput(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalizeInput));
  if (value && typeof value === "object") {
    const entries = await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await normalizeInput(item)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

async function resolveEndpoint(route: RouteCandidate, preferred?: string) {
  const client = await withTimeout(connectFreeSpace(route.space), CONNECT_TIMEOUT);
  if (!client.view_api) return { client, endpoint: preferred ?? route.endpoints[0], spec: undefined as EndpointInfo | undefined };
  const info = await withTimeout(client.view_api(true), CONNECT_TIMEOUT);
  const map = endpointMap(info);
  const candidates = preferred ? [preferred, ...route.endpoints.filter((endpoint) => endpoint !== preferred)] : route.endpoints;
  for (const candidate of candidates) {
    if (map[candidate]) return { client, endpoint: candidate, spec: map[candidate] };
  }
  throw new Error(`No compatible endpoint is exposed by ${route.space}.`);
}

function buildInputs(logicalId: string, spec: EndpointInfo | undefined, inputs: Inputs): unknown {
  if (!spec?.parameters?.length) return inputs;
  if (Array.isArray(inputs)) return inputs;
  const record = inputs as Record<string, unknown>;
  return spec.parameters.map((param) => pickValue(parameterName(param), record, logicalId));
}

async function execute(client: GradioClient, endpoint: string, spec: EndpointInfo | undefined, logicalId: string, inputs: Inputs) {
  const adapted = buildInputs(logicalId, spec, inputs);
  const normalized = await normalizeInput(adapted);
  if (client.predict) {
    try {
      const result = await withTimeout(client.predict(endpoint, normalized), JOB_TIMEOUT);
      return result;
    } catch (error) {
      console.warn(`[Buddy] predict failed for ${endpoint}; trying queue`, error);
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
      const { client, endpoint, spec } = await resolveEndpoint(route, preferred);
      const result = await execute(client, endpoint, spec, logicalId, inputs);
      if (!usableResult(result, logicalId)) throw new Error("The selected engine returned no usable result.");
      routeCache.set(cacheKey, { ok: true, expires: Date.now() + OK_TTL });
      return firstOutput(result);
    } catch (error) {
      lastError = error;
      routeCache.set(cacheKey, { ok: false, expires: Date.now() + FAIL_TTL });
      onStatus?.("Buddy is switching to the next available engine…");
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
  for (const route of [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority)) {
    try {
      await resolveEndpoint(route);
      routeCache.set(`${logicalId}:${route.space}`, { ok: true, expires: Date.now() + OK_TTL });
      return true;
    } catch {
      routeCache.set(`${logicalId}:${route.space}`, { ok: false, expires: Date.now() + FAIL_TTL });
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
