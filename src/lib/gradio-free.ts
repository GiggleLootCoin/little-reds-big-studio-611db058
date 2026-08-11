import { Client, handle_file } from "@gradio/client";
import { FREE_RUNNERS } from "./free-runners";

type FileLike = File | Blob | string;
type Inputs = Record<string, unknown> | unknown[];
type EndpointParam = { label?: string; parameter_name?: string; component?: string; type?: string; default?: unknown; optional?: boolean; parameter_has_default?: boolean };
type EndpointInfo = { parameters?: EndpointParam[]; returns?: unknown[]; description?: string; fn?: string };
type ApiInfo = { named_endpoints?: Record<string, EndpointInfo>; unnamed_endpoints?: Record<string, EndpointInfo> };
type GradioMessage = { type?: string; data?: unknown; status?: unknown; message?: string };
type GradioJob = AsyncIterable<GradioMessage> & { result?: () => Promise<unknown> };
type GradioClient = { submit: (apiName: string, inputs?: unknown[]) => GradioJob; view_api?: (allEndpoints?: boolean) => Promise<ApiInfo> };
type LogicalId = keyof typeof FREE_SPACE_IDS;
type RouteHealth = { failures: number; successes: number; nextRetryAt: number; lastSuccessAt: number; lastFailureAt: number; lastError?: string };

const CONNECT_TIMEOUT = 30000;
const API_TIMEOUT = 30000;
const JOB_TIMEOUT = 12 * 60 * 1000;
const API_CACHE_TTL = 30000;
const FAILURE_BASE_TTL = 8000;
const FAILURE_MAX_TTL = 120000;

export const FREE_SPACE_IDS = {
  speechToText: "speechToText", music: "music", image: "image", video: "video",
  voiceClone: "voiceClone", voicePreset: "voicePreset", voiceSwap: "voiceSwap", vocalSeparation: "vocalSeparation",
} as const;

const capabilities: Record<LogicalId, string[]> = {
  speechToText: ["speech-to-text", "realtime-asr", "transcription"],
  music: ["music", "song", "lyrics-to-music", "audio-to-audio"],
  image: ["image", "artwork", "cover", "image-edit"],
  video: ["video", "image-to-video", "text-to-video", "audio-to-video", "music-video"],
  voiceClone: ["voice-clone", "tts"],
  voicePreset: ["tts", "multilingual-tts"],
  voiceSwap: ["voice-swap", "singing-voice-conversion", "ai-cover"],
  vocalSeparation: ["vocal-separation", "vocal-isolation", "stems"],
};

const clients = new Map<string, Promise<GradioClient>>();
const apiCache = new Map<string, { info: ApiInfo; expires: number }>();
const health = new Map<string, RouteHealth>();

function timeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })])
    .finally(() => timer && clearTimeout(timer));
}

function stateFor(logical: LogicalId, space: string) {
  const key = `${logical}:${space}`;
  const current = health.get(key);
  if (current) return current;
  const state: RouteHealth = { failures: 0, successes: 0, nextRetryAt: 0, lastSuccessAt: 0, lastFailureAt: 0 };
  health.set(key, state);
  return state;
}
function healthy(logical: LogicalId, space: string) {
  const s = stateFor(logical, space); s.successes++; s.failures = 0; s.nextRetryAt = 0; s.lastSuccessAt = Date.now(); delete s.lastError;
}
function failed(logical: LogicalId, space: string, error: unknown) {
  const s = stateFor(logical, space); s.failures++; s.lastFailureAt = Date.now(); s.lastError = error instanceof Error ? error.message : String(error);
  s.nextRetryAt = Date.now() + Math.min(FAILURE_MAX_TTL, FAILURE_BASE_TTL * 2 ** Math.min(s.failures - 1, 4));
  apiCache.delete(space); clients.delete(space);
}
export function getFreeRuntimeHealth() { return Object.fromEntries(health.entries()); }

function spaceId(url: string) { return url.replace(/^https?:\/\/huggingface\.co\/spaces\//, "").replace(/\/$/, ""); }
function routesFor(logical: LogicalId) {
  const wanted = new Set(capabilities[logical]);
  return FREE_RUNNERS.filter(r => r.kind === "public" && r.capabilities.some(c => wanted.has(c)))
    .map(r => ({ space: spaceId(r.url), priority: r.priority }))
    .sort((a, b) => b.priority - a.priority);
}

export function connectFreeSpace(space: string, onStatus?: (message: string) => void) {
  let client = clients.get(space);
  if (!client) {
    client = Client.connect(space, { status_callback: (status: unknown) => {
      const s = status as { message?: string; stage?: string };
      const message = typeof status === "string" ? status : s?.message || s?.stage;
      if (message) onStatus?.(String(message));
    } }) as unknown as Promise<GradioClient>;
    client.catch(() => clients.delete(space));
    clients.set(space, client);
  }
  return client;
}
export function freeFile(file: FileLike) { return file; }

function norm(value: unknown) { return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function endpoints(info: ApiInfo) { return { ...(info.named_endpoints ?? {}), ...(info.unnamed_endpoints ?? {}) }; }
function paramName(p: EndpointParam) { return norm(p.parameter_name ?? p.label); }

function aliases(name: string) {
  const map: Record<string, string[]> = {
    prompt: ["prompt", "description", "textprompt", "styleprompt", "text", "captions", "caption"],
    captions: ["captions", "caption", "prompt", "description"], caption: ["caption", "captions", "prompt", "description"],
    text: ["text", "prompt", "targettext", "lyrics", "lrc", "captions", "caption"],
    lyrics: ["lyrics", "lrc", "lyric", "text"], lrc: ["lrc", "lyrics", "text"],
    audio: ["audio", "inputaudio", "sourceaudio", "sourceaudiopath", "audiofile", "referenceaudio", "refaudio"],
    sourceaudio: ["sourceaudio", "sourceaudiopath", "audio"], sourceaudiopath: ["sourceaudiopath", "sourceaudio", "audio"],
    targetaudio: ["targetaudio", "targetaudiopath", "referenceaudio", "refaudio"], targetaudiopath: ["targetaudiopath", "targetaudio", "referenceaudio", "refaudio"],
    refaudio: ["refaudio", "referenceaudio", "targetaudio", "targetaudiopath"], referenceaudio: ["referenceaudio", "refaudio", "targetaudio", "targetaudiopath"],
    image: ["image", "inputimage", "sourceimage", "imagefile", "input"], inputimage: ["inputimage", "image", "sourceimage"],
    input: ["input", "image", "audio", "video"], video: ["video", "inputvideo", "sourcevideo", "videofile"],
  };
  return map[name] ?? [];
}

function sourceFor(logical: LogicalId, name: string, inputs: Record<string, unknown>) {
  const n = norm(name);
  const exact = Object.entries(inputs).find(([k]) => norm(k) === n)?.[1];
  if (exact !== undefined) return exact;
  for (const alias of aliases(n)) {
    const value = Object.entries(inputs).find(([k]) => norm(k) === alias)?.[1];
    if (value !== undefined) return value;
  }
  if (logical === "video" && n.includes("image")) return inputs.input_image ?? inputs.image;
  if ((logical === "voiceClone" || logical === "voicePreset") && n.includes("text")) return inputs.text ?? inputs.target_text;
  if (n.includes("seed") && !n.includes("random")) return inputs.seed;
  if (n.includes("random") && n.includes("seed")) return inputs.randomize_seed ?? inputs.use_random_seed;
  if (n.includes("duration")) return inputs.duration ?? inputs.audio_duration;
  if (n.includes("height")) return inputs.height;
  if (n.includes("width")) return inputs.width;
  if (n.includes("language") || n === "lang") return inputs.language ?? inputs.vocal_language;
  if (n.includes("speaker") || n.includes("voiceid")) return inputs.speaker;
  if (n.includes("instruct")) return inputs.instruct;
  if (n.includes("steps") || n.includes("inferstep")) return inputs.steps ?? inputs.inference_steps ?? inputs.diffusion_steps;
  if (n.includes("cfg") || n.includes("guidance")) return inputs.cfg_strength ?? inputs.guidance_scale ?? inputs.inference_cfg_rate;
  if (n.includes("format") && !n.includes("caption")) return inputs.file_type ?? inputs.audio_format;
  if (n.includes("instrumental")) return inputs.instrumental ?? false;
  if (n.includes("model") && logical === "voiceClone") return inputs.model_size;
  if (n.includes("pitch")) return inputs.pitch_shift;
  if (n.includes("length") && logical === "voiceSwap") return inputs.length_adjust;
  return undefined;
}
function hidden(p: EndpointParam) { const c = norm(`${p.component ?? ""} ${p.type ?? ""}`); return c.includes("state") || c.includes("event") || c.includes("button"); }

async function apiFor(space: string, onStatus?: (message: string) => void) {
  const cached = apiCache.get(space); if (cached && cached.expires > Date.now()) return cached.info;
  const client = await timeout(connectFreeSpace(space, onStatus), CONNECT_TIMEOUT, `Could not connect to ${space}.`);
  if (!client.view_api) throw new Error(`Free engine ${space} does not expose live API metadata.`);
  const info = await timeout(client.view_api(true), API_TIMEOUT, `Free engine ${space} did not expose its API in time.`);
  if (!Object.keys(endpoints(info)).length) throw new Error(`Free engine ${space} exposed no callable endpoints.`);
  apiCache.set(space, { info, expires: Date.now() + API_CACHE_TTL }); return info;
}

function compatible(logical: LogicalId, spec: EndpointInfo, inputs: Inputs) {
  if (Array.isArray(inputs)) return true;
  const record = inputs as Record<string, unknown>;
  for (const p of spec.parameters ?? []) {
    if (sourceFor(logical, paramName(p), record) !== undefined || p.default !== undefined || p.optional || p.parameter_has_default || hidden(p)) continue;
    return false;
  }
  return true;
}

function score(logical: LogicalId, endpoint: string, spec: EndpointInfo, inputs: Record<string, unknown>) {
  const text = norm(`${endpoint} ${spec.fn ?? ""} ${spec.description ?? ""}`);
  const words: Record<LogicalId, string[]> = {
    speechToText: ["transcrib", "whisper", "asr", "speech", "stt"], music: ["music", "song", "generate", "create", "infer"],
    image: ["image", "txt2img", "text2image", "generate", "create"], video: ["video", "i2v", "image2video", "generate", "create", "infer"],
    voiceClone: ["clone", "voice", "tts", "generate"], voicePreset: ["custom", "tts", "voice", "generate"],
    voiceSwap: ["convert", "voice", "rvc", "seed", "singing"], vocalSeparation: ["separat", "stem", "demucs", "vocal"],
  };
  let value = words[logical].reduce((sum, word) => sum + (text.includes(word) ? 14 : 0), 0);
  for (const p of spec.parameters ?? []) {
    const c = norm(`${p.component ?? ""} ${p.type ?? ""}`); const v = sourceFor(logical, paramName(p), inputs);
    value += v !== undefined || p.default !== undefined || p.optional || p.parameter_has_default || hidden(p) ? 6 : -50;
    if (logical === "image" && c.includes("image")) value += 20;
    if (logical === "video" && (c.includes("image") || c.includes("video"))) value += 20;
    if (logical === "speechToText" && c.includes("audio")) value += 20;
  }
  for (const o of spec.returns ?? []) {
    const s = norm(JSON.stringify(o));
    if (logical === "image" && s.includes("image")) value += 25;
    if (logical === "video" && s.includes("video")) value += 25;
    if (["music", "voiceClone", "voicePreset", "voiceSwap", "vocalSeparation"].includes(logical) && s.includes("audio")) value += 25;
    if (logical === "speechToText" && (s.includes("text") || s.includes("string"))) value += 20;
  }
  return value;
}

async function resolve(logical: LogicalId, space: string, inputs: Inputs, preferred: string | undefined, onStatus?: (message: string) => void) {
  const client = await timeout(connectFreeSpace(space, onStatus), CONNECT_TIMEOUT, `Could not connect to ${space}.`);
  const map = endpoints(await apiFor(space, onStatus));
  if (preferred && map[preferred] && compatible(logical, map[preferred], inputs)) return { client, endpoint: preferred, spec: map[preferred] };
  const record = Array.isArray(inputs) ? {} : inputs as Record<string, unknown>;
  const ranked = Object.entries(map).map(([endpoint, spec]) => ({ endpoint, spec, score: score(logical, endpoint, spec, record) }))
    .filter(x => compatible(logical, x.spec, inputs)).sort((a, b) => b.score - a.score);
  const best = ranked[0]; if (!best || best.score < 0) throw new Error(`No compatible live endpoint is exposed by ${space}.`);
  return { client, endpoint: best.endpoint, spec: best.spec };
}

async function normalize(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalize));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([k, v]) => [k, await normalize(v)] as const)));
  return value;
}
function buildInputs(logical: LogicalId, spec: EndpointInfo, inputs: Inputs) {
  if (Array.isArray(inputs)) return inputs;
  const record = inputs as Record<string, unknown>;
  return (spec.parameters ?? []).map(p => {
    const v = sourceFor(logical, paramName(p), record);
    if (v !== undefined) return v;
    if (p.default !== undefined) return p.default;
    if (p.optional || p.parameter_has_default || hidden(p)) return null;
    throw new Error(`Required input ${p.parameter_name ?? p.label ?? "unknown"} is missing.`);
  });
}

function statusError(status: unknown) {
  if (!status || typeof status !== "object") return null;
  const s = status as { stage?: string; message?: string; code?: string };
  if (String(s.stage ?? "").toLowerCase() === "error") return s.message || s.code || "Free engine reported an error.";
  return null;
}
function hasOutput(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.size > 0;
  if (Array.isArray(value)) return value.some(hasOutput);
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    return Object.keys(r).length > 0 && ["url", "path", "blob", "data", "value", "file", "audio", "image", "video", "text", "generated_text", "transcript", "transcription"].some(k => hasOutput(r[k]));
  }
  return true;
}

async function execute(logical: LogicalId, space: string, endpoint: string, spec: EndpointInfo, client: GradioClient, inputs: Inputs, onStatus?: (message: string) => void) {
  const normalized = await normalize(buildInputs(logical, spec, inputs));
  const job = client.submit(endpoint, normalized as unknown[]);
  let latest: unknown;
  for await (const message of job) {
    const error = statusError(message.status); if (error) throw new Error(`${space}: ${error}`);
    if (message.type === "error") throw new Error(message.message ? String(message.message) : `${space} reported an error.`);
    if (message.message) onStatus?.(String(message.message));
    if (message.status) { const s = typeof message.status === "string" ? message.status : JSON.stringify(message.status); onStatus?.(s); }
    if (message.type === "data" && message.data !== undefined) latest = message.data;
  }
  if (latest === undefined && job.result) latest = await timeout(job.result(), JOB_TIMEOUT, `${space} did not return a result.`);
  if (!hasOutput(latest)) throw new Error(`${space} completed without a usable output.`);
  return latest;
}

async function run(logical: LogicalId, preferred: string | undefined, inputs: Inputs, onStatus?: (message: string) => void) {
  let lastError: unknown = null;
  for (const route of routesFor(logical)) {
    const state = stateFor(logical, route.space); if (state.nextRetryAt > Date.now()) continue;
    try {
      onStatus?.(`Trying free ${logical} engine: ${route.space}`);
      const resolved = await resolve(logical, route.space, inputs, preferred, onStatus);
      const result = await timeout(execute(logical, route.space, resolved.endpoint, resolved.spec, resolved.client, inputs, onStatus), JOB_TIMEOUT, `${route.space} timed out.`);
      healthy(logical, route.space); onStatus?.(`Free engine completed: ${route.space}`); return result;
    } catch (error) {
      lastError = error; failed(logical, route.space, error); onStatus?.(`${route.space} unavailable; trying the next free engine…`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`No working free ${logical} engine is available right now.`);
}

export async function runGradio(logical: LogicalId, preferred: string | undefined, inputs: Inputs, onStatus?: (message: string) => void) {
  return run(logical, preferred || undefined, inputs, onStatus);
}
export async function runGradioAll(logical: LogicalId, preferred: string | undefined, inputs: Inputs, onStatus?: (message: string) => void): Promise<unknown[]> {
  const result = await run(logical, preferred || undefined, inputs, onStatus); return Array.isArray(result) ? result : [result];
}

function artifact(value: unknown): string | null {
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (typeof value === "string") {
    const t = value.trim();
    if (/^(https?:|blob:|data:|\/gradio_api\/file=|\/file=|file=)/.test(t)) return t;
    try { return t.startsWith("{") || t.startsWith("[") ? artifact(JSON.parse(t)) : null; } catch { return null; }
  }
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) { for (const item of value) { const found = artifact(item); if (found) return found; } return null; }
  const r = value as Record<string, unknown>;
  for (const key of ["url", "blob", "data", "value", "file", "audio", "image", "video", "audio_url", "image_url", "video_url", "path"]) { const found = artifact(r[key]); if (found) return found; }
  return null;
}
export function outputUrl(value: unknown) { return artifact(value); }
export function firstOutput(value: unknown) { return Array.isArray(value) && value.length === 1 ? value[0] : value; }
