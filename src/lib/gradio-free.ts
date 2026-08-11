import { Client, handle_file } from "@gradio/client";
import { FREE_RUNNERS } from "./free-runners";

type FileLike = File | Blob | string;
type Inputs = Record<string, unknown> | unknown[];
type EndpointParam = { label?: string; parameter_name?: string; component?: string; type?: string; default?: unknown; optional?: boolean; parameter_has_default?: boolean };
type EndpointInfo = { parameters?: EndpointParam[]; returns?: unknown[]; description?: string; fn?: string };
type ApiInfo = { named_endpoints?: Record<string, EndpointInfo>; unnamed_endpoints?: Record<string, EndpointInfo> };
type GradioMessage = { type?: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = { submit: (apiName: string, inputs?: unknown) => GradioJob; predict?: (apiName: string, inputs?: unknown) => Promise<unknown>; view_api?: (all_endpoints?: boolean) => Promise<ApiInfo> };
type RouteCandidate = { space: string; priority: number };
type RouteHealth = { failures: number; successes: number; nextRetryAt: number; lastSuccessAt: number; lastFailureAt: number; lastError?: string };

const CONNECT_TIMEOUT = 30_000;
const API_TIMEOUT = 30_000;
const JOB_TIMEOUT = 12 * 60_000;
const FAILURE_BASE_TTL = 8_000;
const FAILURE_MAX_TTL = 2 * 60_000;
const API_CACHE_TTL = 60_000;
const MAX_ROUTE_RETRIES = 2;

const clients = new Map<string, Promise<GradioClient>>();
const apiCache = new Map<string, { info: ApiInfo; expires: number }>();
const health = new Map<string, RouteHealth>();

export const FREE_SPACE_IDS = { speechToText: "speechToText", music: "music", image: "image", video: "video", voiceClone: "voiceClone", voicePreset: "voicePreset", voiceSwap: "voiceSwap", vocalSeparation: "vocalSeparation" } as const;
type LogicalId = keyof typeof FREE_SPACE_IDS;

const capabilityFor: Record<LogicalId, string[]> = {
  speechToText: ["speech-to-text", "realtime-asr", "transcription"],
  music: ["music", "song", "lyrics-to-music", "audio-to-audio"],
  image: ["image", "artwork", "cover", "image-edit"],
  video: ["video", "image-to-video", "audio-to-video", "music-video"],
  voiceClone: ["voice-clone", "tts"],
  voicePreset: ["tts", "multilingual-tts"],
  voiceSwap: ["voice-swap", "singing-voice-conversion", "ai-cover"],
  vocalSeparation: ["vocal-separation", "vocal-isolation", "stems"],
};

function routesFor(logicalId: LogicalId): RouteCandidate[] {
  const wanted = new Set(capabilityFor[logicalId]);
  return FREE_RUNNERS.filter((runner) => runner.kind === "public" && runner.capabilities.some((capability) => wanted.has(capability)))
    .map((runner) => ({ space: runner.url.replace("https://huggingface.co/spaces/", "").replace(/\/$/, ""), priority: runner.priority }))
    .sort((a, b) => b.priority - a.priority);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("Free generation service timed out.")), ms); })]); }
  finally { if (timer) clearTimeout(timer); }
}
function routeKey(logicalId: string, space: string) { return `${logicalId}:${space}`; }
function getHealth(logicalId: string, space: string): RouteHealth {
  const existing = health.get(routeKey(logicalId, space));
  if (existing) return existing;
  const created: RouteHealth = { failures: 0, successes: 0, nextRetryAt: 0, lastSuccessAt: 0, lastFailureAt: 0 };
  health.set(routeKey(logicalId, space), created);
  return created;
}
function markHealthy(logicalId: string, space: string) { const state = getHealth(logicalId, space); state.successes += 1; state.failures = 0; state.nextRetryAt = 0; state.lastSuccessAt = Date.now(); state.lastError = undefined; }
function markUnhealthy(logicalId: string, space: string, error: unknown) { const state = getHealth(logicalId, space); state.failures += 1; state.lastFailureAt = Date.now(); state.lastError = error instanceof Error ? error.message : String(error); state.nextRetryAt = Date.now() + Math.min(FAILURE_MAX_TTL, FAILURE_BASE_TTL * 2 ** Math.min(state.failures - 1, 5)); apiCache.delete(space); clients.delete(space); }

export function connectFreeSpace(space: string) { let client = clients.get(space); if (!client) { client = Client.connect(space) as unknown as Promise<GradioClient>; client.catch(() => clients.delete(space)); clients.set(space, client); } return client; }
export function freeFile(file: FileLike): FileLike { return file; }

function normalizeName(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function parameterName(param: EndpointParam) { return normalizeName(String(param.parameter_name ?? param.label ?? "")); }
function endpointMap(info: ApiInfo) { return { ...(info.named_endpoints ?? {}), ...(info.unnamed_endpoints ?? {}) }; }

const aliases: Record<string, string[]> = {
  audio: ["audio", "inputaudio", "sourceaudio", "sourceaudiopath", "audiofile", "input"],
  image: ["image", "inputimage", "sourceimage", "imagefile", "input"],
  video: ["video", "inputvideo", "sourcevideo", "videofile", "input"],
  prompt: ["prompt", "description", "textprompt", "styleprompt", "text"],
  textprompt: ["textprompt", "prompt", "description", "text"],
  description: ["description", "prompt", "textprompt", "text"],
  text: ["text", "targettext", "prompt", "lyrics"],
  lyrics: ["lyrics", "lrc", "lyric", "text"],
  lrc: ["lrc", "lyrics", "text"],
  targettext: ["targettext", "text"],
  refaudio: ["refaudio", "referenceaudio", "sourceaudio", "targetaudiopath"],
  referenceaudio: ["referenceaudio", "refaudio", "sourceaudio", "targetaudiopath"],
  targetaudio: ["targetaudio", "targetaudiopath", "referenceaudio", "refaudio"],
  targetaudiopath: ["targetaudiopath", "targetaudio", "referenceaudio", "refaudio"],
  seed: ["seed"], randomizeseed: ["randomizeseed"], steps: ["steps", "inferstep", "inferencesteps", "diffusionsteps"],
  cfgstrength: ["cfgstrength", "guidancescale", "guidance"], guidance: ["guidance", "guidancescale"], guidancescale: ["guidancescale", "guidance"],
  height: ["height"], width: ["width"], duration: ["duration", "durationseconds", "seconds"],
  language: ["language", "lang"], speaker: ["speaker", "voice", "voiceid"], instruct: ["instruct", "instruction"], instruction: ["instruction", "instruct"],
};
function pickValue(name: string, inputs: Record<string, unknown>, logicalId: string) {
  const direct = Object.entries(inputs).find(([key]) => normalizeName(key) === name); if (direct) return direct[1];
  for (const candidate of aliases[name] ?? [name]) { const found = Object.entries(inputs).find(([key]) => normalizeName(key) === candidate); if (found) return found[1]; }
  if (logicalId === "speechToText" && (name.includes("audio") || name === "input")) return inputs.audio;
  return undefined;
}

function artifactUrl(value: unknown): string | null {
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (typeof value === "string") {
    const text = value.trim();
    if (/^(https?:|blob:|data:|\/gradio_api\/file=|\/file=|file=|\/tmp\/|\/home\/|\/data\/)/.test(text)) return text;
    try { if (text.startsWith("{") || text.startsWith("[")) return artifactUrl(JSON.parse(text)); } catch { return null; }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) { for (const item of value) { const found = artifactUrl(item); if (found) return found; } return null; }
  const record = value as Record<string, unknown>;
  for (const field of ["url", "path", "blob", "data", "value", "file", "audio", "image", "video", "audio_url", "video_url", "image_url"]) { const found = artifactUrl(record[field]); if (found) return found; }
  return null;
}
export function outputUrl(value: unknown) { return artifactUrl(value); }
export function firstOutput(value: unknown): unknown { if (typeof value === "string") { try { return firstOutput(JSON.parse(value)); } catch { return value; } } if (!value || typeof value !== "object") return value; return (value as Record<string, unknown>).data ?? value; }
function textOutput(value: unknown): string | null { if (typeof value === "string" && value.trim()) return value.trim(); if (Array.isArray(value)) for (const item of value) { const found = textOutput(item); if (found) return found; } if (value && typeof value === "object") { const record = value as Record<string, unknown>; for (const field of ["text", "transcript", "transcription", "value", "data"]) { const found = textOutput(record[field]); if (found) return found; } } return null; }
function isUsableArtifact(value: unknown, logicalId: LogicalId) { const result = firstOutput(value); return logicalId === "speechToText" ? Boolean(textOutput(result)) : Boolean(artifactUrl(result)); }

function endpointScore(logicalId: LogicalId, endpoint: string, spec: EndpointInfo, inputs: Inputs) {
  const name = normalizeName(`${endpoint} ${spec.fn ?? ""} ${spec.description ?? ""}`);
  const keywords: Record<LogicalId, string[]> = {
    speechToText: ["transcrib", "whisper", "asr", "speech", "stt"], music: ["music", "song", "infer", "generate", "create"], image: ["image", "txt2img", "text2image", "generate", "create"], video: ["video", "i2v", "image2video", "generate", "create", "infer"],
    voiceClone: ["clone", "voice", "tts", "custom", "generate"], voicePreset: ["custom", "tts", "voice", "generate"], voiceSwap: ["convert", "voice", "rvc", "seed", "speaker"], vocalSeparation: ["separat", "stem", "demucs", "vocal"],
  };
  let score = keywords[logicalId].reduce((total, keyword) => total + (name.includes(keyword) ? 12 : 0), 0);
  const record = Array.isArray(inputs) ? {} : inputs as Record<string, unknown>;
  for (const param of spec.parameters ?? []) {
    const p = parameterName(param); const component = normalizeName(`${param.component ?? ""} ${param.type ?? ""}`);
    if (pickValue(p, record, logicalId) !== undefined || param.default !== undefined || param.parameter_has_default || param.optional) score += 8; else score -= 25;
    if (logicalId === "image" && component.includes("image")) score += 20;
    if (logicalId === "video" && (component.includes("image") || component.includes("video"))) score += 20;
    if (logicalId === "speechToText" && component.includes("audio")) score += 20;
  }
  for (const output of spec.returns ?? []) {
    const component = normalizeName(JSON.stringify(output));
    if (logicalId === "image" && component.includes("image")) score += 25;
    if (logicalId === "video" && component.includes("video")) score += 25;
    if (["music", "voiceClone", "voicePreset", "voiceSwap", "vocalSeparation"].includes(logicalId) && component.includes("audio")) score += 25;
    if (logicalId === "speechToText" && (component.includes("text") || component.includes("string"))) score += 20;
  }
  return score;
}

async function apiFor(space: string, forceFresh = false) {
  const cached = !forceFresh ? apiCache.get(space) : undefined;
  if (cached && cached.expires > Date.now()) return cached.info;
  const client = await withTimeout(connectFreeSpace(space), CONNECT_TIMEOUT);
  if (!client.view_api) return { named_endpoints: {}, unnamed_endpoints: {} } as ApiInfo;
  const info = await withTimeout(client.view_api(true), API_TIMEOUT);
  apiCache.set(space, { info, expires: Date.now() + API_CACHE_TTL });
  return info;
}
async function resolveEndpoint(logicalId: LogicalId, route: RouteCandidate, inputs: Inputs, preferred?: string, forceFresh = false) {
  const client = await withTimeout(connectFreeSpace(route.space), CONNECT_TIMEOUT);
  const info = await apiFor(route.space, forceFresh); const map = endpointMap(info);
  if (preferred && map[preferred]) return { client, endpoint: preferred, spec: map[preferred] };
  const record = Array.isArray(inputs) ? {} : inputs as Record<string, unknown>;
  const ranked = Object.entries(map)
    .filter(([, spec]) => (spec.parameters ?? []).every((param) => pickValue(parameterName(param), record, logicalId) !== undefined || param.default !== undefined || param.parameter_has_default || param.optional))
    .map(([endpoint, spec]) => ({ endpoint, spec, score: endpointScore(logicalId, endpoint, spec, inputs) }))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0];
  if (!selected || selected.score < 0) throw new Error(`No compatible live endpoint is exposed by ${route.space}.`);
  return { client, endpoint: selected.endpoint, spec: selected.spec };
}
async function normalizeInput(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalizeInput));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await normalizeInput(item)] as const)));
  return value;
}
function buildInputs(logicalId: LogicalId, spec: EndpointInfo, inputs: Inputs): unknown {
  if (Array.isArray(inputs)) return inputs;
  const record = inputs as Record<string, unknown>;
  return (spec.parameters ?? []).map((param) => { const value = pickValue(parameterName(param), record, logicalId); if (value !== undefined) return value; if (param.default !== undefined) return param.default; if (param.parameter_has_default || param.optional) return null; throw new Error(`Required input "${param.parameter_name ?? param.label ?? "unknown"}" is unavailable.`); });
}
async function execute(client: GradioClient, endpoint: string, spec: EndpointInfo, logicalId: LogicalId, inputs: Inputs) {
  const normalized = await normalizeInput(buildInputs(logicalId, spec, inputs));
  if (client.predict) { try { return await withTimeout(client.predict(endpoint, normalized), JOB_TIMEOUT); } catch (error) { console.warn(`[Buddy] direct prediction failed for ${endpoint}; trying queued execution`, error); } }
  const job = client.submit(endpoint, normalized); let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The generation service returned no result.");
  return latest;
}
async function runRoute(logicalId: LogicalId, route: RouteCandidate, inputs: Inputs, onStatus?: (message: string) => void, preferred?: string) {
  const state = getHealth(logicalId, route.space);
  if (state.nextRetryAt > Date.now()) throw new Error(`Route cooling down: ${route.space}`);
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ROUTE_RETRIES; attempt += 1) {
    try {
      const resolved = await resolveEndpoint(logicalId, route, inputs, preferred, attempt > 0);
      const result = await execute(resolved.client, resolved.endpoint, resolved.spec, logicalId, inputs);
      if (!isUsableArtifact(result, logicalId)) throw new Error("The selected engine returned no usable artifact.");
      markHealthy(logicalId, route.space);
      return logicalId === "speechToText" ? textOutput(firstOutput(result)) ?? result : firstOutput(result);
    } catch (error) {
      lastError = error; markUnhealthy(logicalId, route.space, error);
      onStatus?.(attempt === 0 ? "That engine did not return a usable result. Repairing the route…" : "Trying another free engine…");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Free route failed.");
}
export function getFreeRuntimeHealth() { return Object.fromEntries([...health.entries()].map(([route, state]) => [route, { ...state, available: state.nextRetryAt <= Date.now() }])); }
export function resetFreeRuntimeHealth() { health.clear(); apiCache.clear(); clients.clear(); }
async function collect(logicalId: LogicalId, inputs: Inputs, onStatus?: (message: string) => void, preferred?: string) {
  const candidates = routesFor(logicalId).sort((a, b) => { const ah = getHealth(logicalId, a.space); const bh = getHealth(logicalId, b.space); const ap = ah.nextRetryAt > Date.now() ? 1_000_000 : ah.failures * 10; const bp = bh.nextRetryAt > Date.now() ? 1_000_000 : bh.failures * 10; return (b.priority - bp) - (a.priority - ap); });
  if (!candidates.length) throw new Error(`No free public route is configured for ${logicalId}.`);
  let lastError: unknown = null;
  for (const route of candidates) { try { onStatus?.("Finding the best available free engine…"); return await runRoute(logicalId, route, inputs, onStatus, preferred); } catch (error) { lastError = error; onStatus?.("Switching to the best remaining free option…"); } }
  throw lastError instanceof Error ? lastError : new Error("No free generation route is currently available.");
}
function logicalIdFor(space: string): LogicalId | "" {
  if (Object.prototype.hasOwnProperty.call(FREE_SPACE_IDS, space)) return space as LogicalId;
  return (Object.keys(FREE_SPACE_IDS) as LogicalId[]).find((logicalId) => routesFor(logicalId).some((route) => route.space === space)) ?? "";
}
export async function probeFreeRoute(logicalId: string) {
  if (!(logicalId in FREE_SPACE_IDS)) return false;
  for (const route of routesFor(logicalId as LogicalId)) { try { const info = await apiFor(route.space, true); if (Object.keys(endpointMap(info)).length) { markHealthy(logicalId, route.space); return true; } } catch (error) { markUnhealthy(logicalId, route.space, error); } }
  return false;
}
export async function runGradio(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) { const logicalId = logicalIdFor(space); if (!logicalId) throw new Error(`Unknown free generation service: ${space}`); return collect(logicalId, inputs, onStatus, apiName || undefined); }
export async function runGradioAll(space: string, apiName: string, inputs: Inputs, onStatus?: (message: string) => void) { const result = await runGradio(space, apiName, inputs, onStatus); return Array.isArray(result) ? result : [result]; }
