import { Client, handle_file } from "@gradio/client";
import { FREE_RUNNERS } from "./free-runners";
import {
  allRuntimeHealth,
  isRuntimeAvailable,
  recordRuntimeFailure,
  recordRuntimeSuccess,
} from "./free-runtime-health";
import {
  markProviderFailure,
  markProviderSuccess,
  providerAvailable,
} from "./free-provider-policy";

type LogicalId =
  | "speechToText"
  | "music"
  | "image"
  | "video"
  | "voiceClone"
  | "voicePreset"
  | "voiceSwap"
  | "vocalSeparation";
type InputMap = Record<string, unknown>;
type Param = {
  label?: string;
  parameter_name?: string;
  component?: string;
  type?: string;
  default?: unknown;
  optional?: boolean;
  parameter_has_default?: boolean;
};
type Endpoint = { parameters?: Param[]; returns?: unknown[]; description?: string; fn?: string };
type ApiInfo = {
  named_endpoints?: Record<string, Endpoint>;
  unnamed_endpoints?: Record<string, Endpoint>;
};
type ClientLike = {
  predict: (endpoint: string, inputs?: unknown[]) => Promise<{ data?: unknown[] } | unknown[]>;
  view_api?: (all_endpoints?: boolean) => Promise<ApiInfo>;
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
const wanted: Record<LogicalId, string[]> = {
  speechToText: ["speech-to-text", "transcription", "realtime-asr"],
  music: ["music", "song", "lyrics-to-music", "audio-to-audio"],
  image: ["image", "artwork", "cover", "image-edit"],
  video: ["video", "image-to-video", "text-to-video", "audio-to-video", "music-video"],
  voiceClone: ["voice-clone", "tts"],
  voicePreset: ["tts", "multilingual-tts"],
  voiceSwap: ["voice-swap", "singing-voice-conversion", "ai-cover"],
  vocalSeparation: ["vocal-separation", "vocal-isolation", "stems"],
};
const clients = new Map<string, Promise<ClientLike>>();
const apis = new Map<string, { value: ApiInfo; expires: number }>();
const clean = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const endpointMap = (api: ApiInfo) => ({
  ...(api.named_endpoints ?? {}),
  ...(api.unnamed_endpoints ?? {}),
});
const spaceName = (url: string) =>
  url.replace(/^https?:\/\/huggingface\.co\/spaces\//, "").replace(/\/$/, "");
const wait = <T>(p: Promise<T>, ms: number, message: string) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => timer && clearTimeout(timer));
};

export function connectFreeSpace(space: string, onStatus?: (message: string) => void) {
  let promise = clients.get(space);
  if (!promise) {
    promise = Client.connect(space, {
      events: ["data", "status"],
      status_callback: (status: unknown) => {
        const s = status as { message?: string; status?: string; load_status?: string };
        const message = s?.message || s?.load_status || s?.status || String(status);
        if (message) onStatus?.(message);
      },
    }) as unknown as Promise<ClientLike>;
    promise.catch(() => clients.delete(space));
    clients.set(space, promise);
  }
  return promise;
}
export function freeFile(file: File | Blob | string) {
  return file;
}
export function getFreeRuntimeHealth() {
  return allRuntimeHealth();
}
function aliases(name: string) {
  const n = clean(name);
  const groups: Record<string, string[]> = {
    prompt: ["prompt", "description", "text", "lyrics", "captions", "caption"],
    text: ["text", "prompt", "targettext", "lyrics", "caption", "captions"],
    lyrics: ["lyrics", "lyric", "lrc", "text", "prompt"],
    audio: [
      "audio",
      "inputaudio",
      "sourceaudio",
      "audiofile",
      "referenceaudio",
      "refaudio",
      "filepath",
      "file",
    ],
    image: ["image", "inputimage", "sourceimage", "imagefile", "input", "filepath", "file"],
    input: ["input", "image", "audio", "video", "file"],
    video: ["video", "inputvideo", "sourcevideo", "videofile", "filepath", "file"],
    refaudio: ["refaudio", "referenceaudio", "targetaudio", "audio", "filepath", "file"],
    referenceaudio: ["referenceaudio", "refaudio", "targetaudio", "audio", "filepath", "file"],
    sourceaudio: ["sourceaudio", "audio", "inputaudio", "filepath", "file"],
    audioprompt: ["audioprompt", "audio_prompt", "prompt", "text"],
    duration: ["duration", "audioduration", "seconds", "durationseconds"],
  };
  return groups[n] ?? [];
}
function valueFor(logical: LogicalId, name: string, input: InputMap) {
  const n = clean(name);
  for (const [key, value] of Object.entries(input))
    if (clean(key) === n && value !== undefined && value !== null) return value;
  for (const alias of aliases(n))
    for (const [key, value] of Object.entries(input))
      if (clean(key) === clean(alias) && value !== undefined && value !== null) return value;
  if (n.includes("image")) return input.image ?? input.input_image;
  if (n.includes("audio") || n.includes("refaudio"))
    return (
      input.audio ??
      input.ref_audio ??
      input.reference_audio ??
      input.source_audio ??
      input.audio_prompt
    );
  if (n.includes("video")) return input.video ?? input.input_video;
  if (n.includes("file") || n.includes("path"))
    return input.file ?? input.audio ?? input.image ?? input.video;
  if (n.includes("duration") || n === "seconds")
    return input.duration ?? input.audio_duration ?? 180;
  if (n.includes("language") || n === "lang") return input.language ?? "English";
  if (n.includes("speaker") || n.includes("voiceid")) return input.speaker;
  if (n.includes("instruct")) return input.instruct;
  if (n.includes("random") && n.includes("seed"))
    return input.randomize_seed ?? input.use_random_seed ?? input.random_seed_checkbox ?? true;
  if (n.includes("seed")) return input.seed ?? Math.floor(Math.random() * 2147483647);
  if (n.includes("height")) return input.height ?? 576;
  if (n.includes("width")) return input.width ?? 1024;
  if (n.includes("steps")) return input.steps ?? input.inference_steps ?? 8;
  if (n.includes("guidance") || n === "cfg") return input.cfg_strength ?? input.guidance_scale ?? 5;
  if (n.includes("pitch")) return input.pitch_shift ?? 0;
  if (n.includes("model") && logical === "voiceClone") return input.model_size ?? "1.7B";
  if (n.includes("instrumental")) return input.instrumental ?? false;
  if (n.includes("negative") || n.includes("avoid")) return input.negative_prompt ?? "";
  if (n.includes("aspect")) return input.aspect_ratio ?? "1:1";
  if (n.includes("enhance") && logical === "video") return input.enhance_prompt ?? true;
  return undefined;
}
function hidden(p: Param) {
  const c = clean(`${p.component ?? ""} ${p.type ?? ""}`);
  return c.includes("state") || c.includes("event") || c.includes("button");
}
function scalarDefault(p: Param) {
  const n = clean(p.parameter_name ?? p.label ?? "");
  const t = clean(`${p.component ?? ""} ${p.type ?? ""}`);
  if (p.default !== undefined && p.default !== null) return p.default;
  if (
    /number|float|int|slider/.test(t) ||
    /(duration|seconds|steps|guidance|cfg|temperature|strength|scale|pitch|seed|batch|width|height|fps|rate|overlap|threshold)/.test(
      n,
    )
  ) {
    if (n.includes("seed")) return -1;
    if (n.includes("duration") || n.includes("seconds")) return 180;
    if (n.includes("steps")) return 16;
    if (n.includes("width")) return 1024;
    if (n.includes("height")) return 1024;
    if (n.includes("fps")) return 24;
    if (n.includes("temperature")) return 0.85;
    if (n.includes("pitch")) return 0;
    if (
      n.includes("guidance") ||
      n.includes("cfg") ||
      n.includes("scale") ||
      n.includes("strength")
    )
      return 1;
    return 0;
  }
  if (
    /bool|checkbox|switch/.test(t) ||
    /(random|enable|use_|auto_|stream|enhance|instrumental|vocal|remove|separate)/.test(n)
  )
    return false;
  if (/string|text/.test(t)) return "";
  return undefined;
}
function compatible(spec: Endpoint, logical: LogicalId, input: InputMap) {
  return (spec.parameters ?? []).every(
    (p) =>
      valueFor(logical, p.parameter_name ?? p.label ?? "", input) !== undefined ||
      scalarDefault(p) !== undefined ||
      p.optional ||
      p.parameter_has_default ||
      hidden(p),
  );
}
function score(spec: Endpoint, endpoint: string, logical: LogicalId, input: InputMap) {
  const hay = clean(`${endpoint} ${spec.fn ?? ""} ${spec.description ?? ""}`);
  const words = wanted[logical].flatMap((x) => x.split("-"));
  let value = words.reduce((n, w) => n + (hay.includes(clean(w)) ? 12 : 0), 0);
  for (const p of spec.parameters ?? [])
    value +=
      valueFor(logical, p.parameter_name ?? p.label ?? "", input) !== undefined ||
      scalarDefault(p) !== undefined ||
      p.default !== undefined ||
      p.optional ||
      p.parameter_has_default ||
      hidden(p)
        ? 5
        : -40;
  const returns = clean(JSON.stringify(spec.returns ?? []));
  if (logical === "image" && returns.includes("image")) value += 30;
  if (logical === "video" && returns.includes("video")) value += 30;
  if (
    ["music", "voiceclone", "voicepreset", "voiceswap", "vocalseparation"].includes(logical) &&
    returns.includes("audio")
  )
    value += 30;
  if (logical === "speechToText" && (returns.includes("text") || returns.includes("string")))
    value += 30;
  return value;
}
async function apiFor(space: string, onStatus?: (message: string) => void) {
  const cached = apis.get(space);
  if (cached && cached.expires > Date.now()) return cached.value;
  const client = await wait(
    connectFreeSpace(space, onStatus),
    30000,
    `Could not connect to ${space}.`,
  );
  if (!client.view_api) throw new Error(`${space} does not expose API metadata.`);
  const api = await wait(client.view_api(true), 30000, `${space} API discovery timed out.`);
  if (!Object.keys(endpointMap(api)).length)
    throw new Error(`${space} exposes no callable endpoints.`);
  apis.set(space, { value: api, expires: Date.now() + 30000 });
  return api;
}
function build(spec: Endpoint, logical: LogicalId, input: InputMap) {
  return (spec.parameters ?? []).map((p) => {
    const value = valueFor(logical, p.parameter_name ?? p.label ?? "", input);
    if (value !== undefined && value !== null) return value;
    const fallback = scalarDefault(p);
    if (fallback !== undefined) return fallback;
    if (p.optional || p.parameter_has_default || hidden(p)) return false;
    throw new Error(`Missing required input: ${p.parameter_name ?? p.label ?? "unknown"}`);
  });
}
async function normalize(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return handle_file(value);
  if (Array.isArray(value)) return Promise.all(value.map(normalize));
  if (value && typeof value === "object")
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value as Record<string, unknown>).map(
          async ([k, v]) => [k, await normalize(v)] as const,
        ),
      ),
    );
  return value;
}
function output(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.size > 0;
  if (Array.isArray(value)) return value.some(output);
  if (typeof value === "object")
    return Object.values(value as Record<string, unknown>).some(output);
  return true;
}
async function runOne(
  logical: LogicalId,
  space: string,
  preferred: string | undefined,
  input: InputMap,
  onStatus?: (message: string) => void,
) {
  const client = await connectFreeSpace(space, onStatus);
  const map = endpointMap(await apiFor(space, onStatus));
  const candidates = Object.entries(map)
    .filter(([, spec]) => compatible(spec, logical, input))
    .map(([endpoint, spec]) => ({ endpoint, spec, score: score(spec, endpoint, logical, input) }))
    .filter((candidate) => candidate.score > -20)
    .sort((a, b) => b.score - a.score);
  const selected =
    preferred && map[preferred] && compatible(map[preferred], logical, input)
      ? { endpoint: preferred, spec: map[preferred] }
      : candidates[0];
  if (!selected) throw new Error(`${space}: no compatible endpoint for ${logical}.`);
  onStatus?.(`Running a private generation route…`);
  const args = await normalize(build(selected.spec, logical, input));
  const response = await wait(
    client.predict(selected.endpoint, args as unknown[]),
    12 * 60 * 1000,
    `${space} generation timed out.`,
  );
  const data = Array.isArray(response)
    ? response
    : ((response as { data?: unknown[] }).data ?? response);
  if (!output(data)) throw new Error(`${space}: generation completed without an output.`);
  recordRuntimeSuccess(space);
  recordRuntimeSuccess(`${logical}:${space}`);
  markProviderSuccess(`${logical}:${space}`);
  onStatus?.(`Finished.`);
  return data;
}
export async function runGradio(
  logical: LogicalId,
  preferred: string | undefined,
  inputs: Record<string, unknown> | unknown[],
  onStatus?: (message: string) => void,
) {
  const input = Array.isArray(inputs) ? {} : inputs;
  let last: unknown = null;
  const runners = FREE_RUNNERS.filter(
    (r) => r.kind === "public" && r.capabilities.some((c) => wanted[logical].includes(c)),
  ).sort((a, b) => b.priority - a.priority);
  for (const runner of runners) {
    const space = spaceName(runner.url);
    const key = `${logical}:${space}`;
    if (!providerAvailable(key) || !isRuntimeAvailable(space)) {
      onStatus?.(`Trying the next available generation route…`);
      continue;
    }
    try {
      return await runOne(
        logical,
        space,
        typeof preferred === "string" && preferred ? preferred : undefined,
        input,
        onStatus,
      );
    } catch (error) {
      last = error;
      recordRuntimeFailure(space, error);
      markProviderFailure(key, error);
      onStatus?.(`That generation route was unavailable; Buddy is switching automatically…`);
    }
  }
  throw last instanceof Error
    ? last
    : new Error(
        `No free ${logical} engine is available. All compatible free engines are currently unavailable.`,
      );
}
export async function runGradioAll(
  logical: LogicalId,
  preferred: string | undefined,
  inputs: Record<string, unknown> | unknown[],
  onStatus?: (message: string) => void,
) {
  const value = await runGradio(logical, preferred, inputs, onStatus);
  return Array.isArray(value) ? value : [value];
}
export async function firstOutput(value: unknown) {
  if (Array.isArray(value)) return value.find((item) => item != null && output(item)) ?? null;
  return output(value) ? value : null;
}
export function outputUrl(value: unknown): string | null {
  if (
    typeof value === "string" &&
    /^(https?:\/\/|blob:|data:|\/gradio_api\/file=|\/file=|file=)/i.test(value)
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
