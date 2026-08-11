import { Client, handle_file } from "@gradio/client";
import { FREE_RUNNERS } from "./free-runners";

type LogicalId = "speechToText" | "music" | "image" | "video" | "voiceClone" | "voicePreset" | "voiceSwap" | "vocalSeparation";
type InputMap = Record<string, unknown>;
type Param = { label?: string; parameter_name?: string; component?: string; type?: string; default?: unknown; optional?: boolean; parameter_has_default?: boolean };
type Endpoint = { parameters?: Param[]; returns?: unknown[]; description?: string; fn?: string };
type ApiInfo = { named_endpoints?: Record<string, Endpoint>; unnamed_endpoints?: Record<string, Endpoint> };
type ClientLike = { predict: (endpoint: string, inputs?: unknown[]) => Promise<{ data?: unknown[] } | unknown[]>; view_api?: () => Promise<ApiInfo> };

export const FREE_SPACE_IDS = {
  speechToText: "speechToText", music: "music", image: "image", video: "video",
  voiceClone: "voiceClone", voicePreset: "voicePreset", voiceSwap: "voiceSwap", vocalSeparation: "vocalSeparation",
} as const;

const wanted: Record<LogicalId, string[]> = {
  speechToText: ["speech-to-text", "transcription", "realtime-asr"],
  music: ["music", "song", "lyrics-to-music", "audio-to-audio"],
  image: ["image", "artwork", "cover", "image-edit"],
  video: ["video", "image-to-video", "text-to-video", "audio-to-video", "music-video"],
  voiceClone: ["voice-clone", "tts"], voicePreset: ["tts", "multilingual-tts"],
  voiceSwap: ["voice-swap", "singing-voice-conversion", "ai-cover"],
  vocalSeparation: ["vocal-separation", "vocal-isolation", "stems"],
};
const clients = new Map<string, Promise<ClientLike>>();
const apis = new Map<string, { value: ApiInfo; expires: number }>();
const badUntil = new Map<string, number>();

const clean = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const endpointMap = (api: ApiInfo) => ({ ...(api.named_endpoints ?? {}), ...(api.unnamed_endpoints ?? {}) });
const spaceName = (url: string) => url.replace(/^https?:\/\/huggingface\.co\/spaces\//, "").replace(/\/$/, "");
const wait = <T,>(p: Promise<T>, ms: number, message: string) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => timer && clearTimeout(timer));
};

export function connectFreeSpace(space: string, onStatus?: (message: string) => void) {
  let promise = clients.get(space);
  if (!promise) {
    promise = Client.connect(space, {
      events: ["data", "status"],
      status_callback: (status: unknown) => {
        const s = status as { message?: string; status?: string; load_status?: string };
        onStatus?.(s?.message || s?.load_status || s?.status || String(status));
      },
    }) as unknown as Promise<ClientLike>;
    promise.catch(() => clients.delete(space));
    clients.set(space, promise);
  }
  return promise;
}

export function freeFile(file: File | Blob | string) { return file; }
export function getFreeRuntimeHealth() { return Object.fromEntries([...badUntil.entries()].map(([space, until]) => [space, { unavailableUntil: until }])); }

function aliases(name: string) {
  const n = clean(name);
  const groups: Record<string, string[]> = {
    prompt: ["prompt", "description", "text", "lyrics", "captions", "caption"],
    text: ["text", "prompt", "targettext", "lyrics", "caption", "captions"],
    lyrics: ["lyrics", "lyric", "lrc", "text", "prompt"],
    audio: ["audio", "inputaudio", "sourceaudio", "audiofile", "referenceaudio", "refaudio"],
    image: ["image", "inputimage", "sourceimage", "imagefile", "input"],
    input: ["input", "image", "audio", "video"],
    video: ["video", "inputvideo", "sourcevideo", "videofile"],
    refaudio: ["refaudio", "referenceaudio", "targetaudio", "audio"],
    referenceaudio: ["referenceaudio", "refaudio", "targetaudio", "audio"],
  };
  return groups[n] ?? [];
}
function valueFor(logical: LogicalId, name: string, input: InputMap) {
  const n = clean(name);
  for (const [key, value] of Object.entries(input)) if (clean(key) === n && value !== undefined) return value;
  for (const alias of aliases(n)) for (const [key, value] of Object.entries(input)) if (clean(key) === alias && value !== undefined) return value;
  if (n.includes("image")) return input.image ?? input.input_image;
  if (n.includes("audio") || n.includes("refaudio")) return input.audio ?? input.ref_audio ?? input.reference_audio;
  if (n.includes("video")) return input.video ?? input.input_video;
  if (n.includes("duration")) return input.duration ?? input.audio_duration;
  if (n.includes("language") || n === "lang") return input.language ?? "English";
  if (n.includes("speaker") || n.includes("voiceid")) return input.speaker;
  if (n.includes("instruct")) return input.instruct;
  if (n.includes("seed")) return input.seed ?? 42;
  if (n.includes("random") && n.includes("seed")) return input.randomize_seed ?? true;
  if (n.includes("height")) return input.height ?? 576;
  if (n.includes("width")) return input.width ?? 1024;
  if (n.includes("steps")) return input.steps ?? 8;
  if (n.includes("guidance") || n === "cfg") return input.cfg_strength ?? input.guidance_scale ?? 5;
  if (n.includes("pitch")) return input.pitch_shift ?? 0;
  if (n.includes("model") && logical === "voiceClone") return input.model_size ?? "1.7B";
  if (n.includes("instrumental")) return input.instrumental ?? false;
  return undefined;
}
function hidden(p: Param) { const c = clean(`${p.component ?? ""} ${p.type ?? ""}`); return c.includes("state") || c.includes("event") || c.includes("button"); }
function compatible(spec: Endpoint, logical: LogicalId, input: InputMap) {
  return (spec.parameters ?? []).every((p) => valueFor(logical, p.parameter_name ?? p.label ?? "", input) !== undefined || p.default !== undefined || p.optional || p.parameter_has_default || hidden(p));
}
function score(spec: Endpoint, endpoint: string, logical: LogicalId, input: InputMap) {
  const hay = clean(`${endpoint} ${spec.fn ?? ""} ${spec.description ?? ""}`);
  const words = wanted[logical].flatMap((x) => x.split("-"));
  let score = words.reduce((n, w) => n + (hay.includes(clean(w)) ? 12 : 0), 0);
  for (const p of spec.parameters ?? []) score += valueFor(logical, p.parameter_name ?? p.label ?? "", input) !== undefined || p.default !== undefined || p.optional || p.parameter_has_default || hidden(p) ? 5 : -40;
  const returns = clean(JSON.stringify(spec.returns ?? []));
  if (["image"].includes(logical) && returns.includes("image")) score += 30;
  if (["video"].includes(logical) && returns.includes("video")) score += 30;
  if (["music", "voiceclone", "voicepreset", "voiceswap", "vocalseparation"].includes(logical) && returns.includes("audio")) score += 30;
  if (logical === "speechToText" && (returns.includes("text") || returns.includes("string"))) score += 30;
  return score;
}

async function apiFor(space: string, onStatus?: (message: string) => void) {
  const cached = apis.get(space); if (cached && cached.expires > Date.now()) return cached.value;
  const client = await wait(connectFreeSpace(space, onStatus), 30000, `Could not connect to ${space}.`);
  if (!client.view_api) throw new Error(`${space} does not expose API metadata.`);
  const api = await wait(client.view_api(), 30000, `${space} API discovery timed out.`);
  if (!Object.keys(endpointMap(api)).length) throw new Error(`${space} exposes no callable endpoints.`);
  apis.set(space, { value: api, expires: Date.now() + 30000 });
  return api;
}
function build(spec: Endpoint, logical: LogicalId, input: InputMap) {
  return (spec.parameters ?? []).map((p) => {
    const value = valueFor(logical, p.parameter_name ?? p.label ?? "", input);
    if (value !== undefined) return value;
    if (p.default !== undefined) return p.default;
    if (p.optional || p.parameter_has_default || hidden(p)) return null;
    throw new Error(`Missing required input: ${p.parameter_name ?? p.label ?? "unknown"}`);
  });
}
async function normalize(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalize));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([k, v]) => [k, await normalize(v)] as const)));
  return value;
}
function output(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.size > 0;
  if (Array.isArray(value)) return value.some(output);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(output);
  return true;
}
function artifact(value: unknown): string | null {
  if (typeof Blob !== "undefined" && value instanceof Blob) return URL.createObjectURL(value);
  if (typeof value === "string") { const s = value.trim(); if (/^(https?:|blob:|data:|\/gradio_api\/file=|\/file=|file=)/.test(s)) return s; return null; }
  if (Array.isArray(value)) for (const item of value) { const found = artifact(item); if (found) return found; }
  if (value && typeof value === "object") for (const item of Object.values(value as Record<string, unknown>)) { const found = artifact(item); if (found) return found; }
  return null;
}
export function outputUrl(value: unknown) { return artifact(value); }
export function firstOutput(value: unknown) { return Array.isArray(value) && value.length === 1 ? value[0] : value; }

async function runOne(logical: LogicalId, space: string, preferred: string | undefined, input: InputMap, onStatus?: (message: string) => void) {
  const client = await connectFreeSpace(space, onStatus);
  const map = endpointMap(await apiFor(space, onStatus));
  const record = Object.keys(input).length ? input : {};
  const candidates = Object.entries(map).filter(([, spec]) => compatible(spec, logical, record)).map(([endpoint, spec]) => ({ endpoint, spec, score: score(spec, endpoint, logical, record) })).sort((a, b) => b.score - a.score);
  const selected = preferred && map[preferred] && compatible(map[preferred], logical, record) ? { endpoint: preferred, spec: map[preferred] } : candidates[0];
  if (!selected || score(selected.spec, selected.endpoint, logical, record) < 0) throw new Error(`${space}: no compatible endpoint for ${logical}.`);
  onStatus?.(`Running ${space}${selected.endpoint ? ` ${selected.endpoint}` : ""}…`);
  const args = await normalize(build(selected.spec, logical, record));
  const response = await wait(client.predict(selected.endpoint, args as unknown[]), 12 * 60 * 1000, `${space} generation timed out.`);
  const data = Array.isArray(response) ? response : (response as { data?: unknown[] }).data ?? response;
  if (!output(data)) throw new Error(`${space}: generation completed without an output.`);
  onStatus?.(`Finished with ${space}.`);
  return data;
}

export async function runGradio(logical: LogicalId, preferred: string | undefined, inputs: Record<string, unknown> | unknown[], onStatus?: (message: string) => void) {
  const input = Array.isArray(inputs) ? {} : inputs;
  let last: unknown = null;
  for (const runner of FREE_RUNNERS.filter((r) => r.kind === "public" && r.capabilities.some((c) => wanted[logical].includes(c))).sort((a, b) => b.priority - a.priority)) {
    const space = spaceName(runner.url);
    if ((badUntil.get(space) ?? 0) > Date.now()) continue;
    try { return await runOne(logical, space, typeof preferred === "string" && preferred ? preferred : undefined, input, onStatus); }
    catch (error) { last = error; badUntil.set(space, Date.now() + 10000); onStatus?.(`${space} failed; trying the next free engine…`); }
  }
  throw last instanceof Error ? last : new Error(`No free ${logical} engine is available.`);
}
export async function runGradioAll(logical: LogicalId, preferred: string | undefined, inputs: Record<string, unknown> | unknown[], onStatus?: (message: string) => void) {
  const value = await runGradio(logical, preferred, inputs, onStatus); return Array.isArray(value) ? value : [value];
}
