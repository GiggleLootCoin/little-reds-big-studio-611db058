import { Client, handle_file } from "@gradio/client";

type FileLike = File | Blob | string;
type GradioMessage = { type: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs: unknown) => GradioJob;
  view_api?: () => Promise<unknown>;
};
type GradioModule = {
  Client: { connect: (space: string) => Promise<GradioClient> };
  handle_file?: (file: File | Blob | string) => unknown;
};
type RouteCandidate = { space: string; endpoints: string[]; priority: number };

const ROUTE_TTL = 5 * 60_000;
const GRADIO_TIMEOUT = 30_000;
const clients = new Map<string, Promise<GradioClient>>();
const routeCache = new Map<string, { ok: boolean; expires: number }>();

const ROUTES: Record<string, RouteCandidate[]> = {
  music: [
    {
      space: "victor/ace-step-jam",
      endpoints: ["/generate", "/create", "/predict", "/generate_music"],
      priority: 150,
    },
    { space: "ASLP-lab/DiffRhythm2", endpoints: ["/infer_music", "/predict"], priority: 145 },
    {
      space: "ACE-Step/Ace-Step-v1.5",
      endpoints: ["/generate_music", "/predict", "/create"],
      priority: 130,
    },
    {
      space: "R-Kentaren/ace-step-jam",
      endpoints: ["/create", "/predict", "/generate_music"],
      priority: 110,
    },
  ],
  image: [
    { space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 150 },
    { space: "hf-applications/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 120 },
    { space: "xiaopeng/Awesome-Z-Image-Turbo", endpoints: ["/generate_image"], priority: 100 },
  ],
  video: [
    {
      space: "dream2589632147/Dream-wan2-2-faster-Pro",
      endpoints: ["/generate_video", "/predict"],
      priority: 150,
    },
    { space: "Wan-AI/Wan2.2-S2V", endpoints: ["/predict", "/generate_video"], priority: 140 },
    {
      space: "r3gm/Wan2.2-14B-Fast-Preview",
      endpoints: ["/generate_video", "/predict"],
      priority: 105,
    },
  ],
  voiceClone: [
    {
      space: "Qwen/Qwen3-TTS",
      endpoints: ["/generate_voice_clone", "/generate_custom_voice", "/generate_speech"],
      priority: 150,
    },
    {
      space: "chanikul/Qwen3-TTS",
      endpoints: ["/generate_voice_clone", "/generate_custom_voice", "/generate_speech"],
      priority: 140,
    },
    {
      space: "multimodalart/higgs-audio-v3-tts",
      endpoints: ["/synthesize", "/generate"],
      priority: 125,
    },
    { space: "mrfakename/F5-TTS", endpoints: ["/generate", "/synthesize"], priority: 115 },
  ],
  voicePreset: [
    { space: "hexgrad/Kokoro-TTS", endpoints: ["/generate", "/predict"], priority: 150 },
    {
      space: "Qwen/Qwen3-TTS",
      endpoints: ["/generate_custom_voice", "/generate_speech", "/generate_voice_clone"],
      priority: 140,
    },
    { space: "mrfakename/F5-TTS", endpoints: ["/generate", "/synthesize"], priority: 120 },
  ],
  voiceSwap: [
    {
      space: "Plachta/Seed-VC",
      endpoints: ["/convert_voice_v1_wrapper", "/convert_voice_v2_wrapper", "/convert"],
      priority: 150,
    },
    { space: "r3gm/RVC-Zero", endpoints: ["/convert", "/predict"], priority: 120 },
  ],
  vocalSeparation: [
    { space: "abidlabs/music-separation", endpoints: ["/predict"], priority: 170 },
    {
      space: "JacobLinCool/vocal-separation",
      endpoints: ["/inference", "/separate"],
      priority: 150,
    },
    {
      space: "owiedotch/demucs-stem-separation",
      endpoints: ["/inference", "/predict"],
      priority: 140,
    },
  ],
};

const gradioModule: GradioModule = { Client, handle_file };

export function connectFreeSpace(space: string) {
  let client = clients.get(space);
  if (!client) {
    client = Promise.resolve(Client.connect(space)) as Promise<GradioClient>;
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
    if (s.startsWith("{") || s.startsWith("[")) {
      try {
        return outputUrl(JSON.parse(s));
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
  for (const key of [
    "url",
    "path",
    "data",
    "value",
    "audio",
    "image",
    "video",
    "audio_url",
    "video_url",
    "image_url",
  ]) {
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
  const named = record.named_endpoints;
  if (named && typeof named === "object") return Object.keys(named);
  const unnamed = record.unnamed_endpoints;
  if (unnamed && typeof unnamed === "object") return Object.keys(unnamed);
  return Object.keys(record).filter((key) => key.startsWith("/"));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Route probe timed out.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveEndpoint(route: RouteCandidate, preferredEndpoint?: string) {
  const client = await withTimeout(connectFreeSpace(route.space), GRADIO_TIMEOUT);
  if (!client.view_api) return { client, endpoint: preferredEndpoint ?? route.endpoints[0] };
  const info = await withTimeout(client.view_api(), GRADIO_TIMEOUT);
  const available = endpointNames(info);
  const candidates = preferredEndpoint
    ? [preferredEndpoint, ...route.endpoints.filter((endpoint) => endpoint !== preferredEndpoint)]
    : route.endpoints;
  const endpoint = candidates.find((candidate) => available.includes(candidate));
  if (!endpoint) throw new Error(`No compatible public endpoint found for ${route.space}.`);
  return { client, endpoint };
}

async function normalizeInput(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) return gradioModule.handle_file?.(value) ?? value;
  if (Array.isArray(value)) return Promise.all(value.map((item) => normalizeInput(item)));
  if (value && typeof value === "object" && !(value instanceof Blob)) {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(
        async ([key, item]) => [key, await normalizeInput(item)] as const,
      ),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function normalizeInputs(inputs: Record<string, unknown> | unknown[]) {
  return normalizeInput(inputs);
}

function adaptInputs(
  logicalId: string,
  space: string,
  endpoint: string,
  inputs: Record<string, unknown> | unknown[],
) {
  if (
    logicalId === "music" &&
    space === "ASLP-lab/DiffRhythm2" &&
    endpoint === "/infer_music" &&
    !Array.isArray(inputs)
  ) {
    return {
      lrc: String(inputs.lyrics ?? inputs.lrc ?? ""),
      current_prompt_type: inputs.audio_prompt ? "audio" : "text",
      audio_prompt: inputs.audio_prompt ?? null,
      text_prompt: String(inputs.description ?? inputs.prompt ?? "polished original song"),
      seed: Number(inputs.seed ?? 42),
      randomize_seed: true,
      steps: 16,
      cfg_strength: 1.3,
      file_type: "wav",
      odeint_method: "euler",
    };
  }
  if (
    logicalId === "music" &&
    space === "victor/ace-step-jam" &&
    endpoint === "/generate" &&
    !Array.isArray(inputs)
  ) {
    return {
      prompt: String(inputs.description ?? inputs.prompt ?? "polished modern song"),
      lyrics: String(inputs.lyrics ?? ""),
      audio_duration: Number(inputs.audio_duration ?? 120),
      infer_step: 8,
      guidance_scale: 7,
      seed: Number(inputs.seed ?? -1),
      lora_name_or_path: "",
      lora_weight: 0.8,
    };
  }
  if (
    logicalId === "music" &&
    space === "victor/ace-step-jam" &&
    endpoint === "/create" &&
    !Array.isArray(inputs)
  ) {
    return {
      description: String(inputs.description ?? "polished modern song"),
      audio_duration: Number(inputs.audio_duration ?? 120),
      seed: Number(inputs.seed ?? -1),
      community: false,
    };
  }
  return inputs;
}

export async function probeFreeRoute(logicalId: string): Promise<boolean> {
  for (const route of [...(ROUTES[logicalId] ?? [])].sort((a, b) => b.priority - a.priority)) {
    const key = `${logicalId}:${route.space}`;
    const cached = routeCache.get(key);
    if (cached && cached.expires > Date.now()) {
      if (cached.ok) return true;
      continue;
    }
    try {
      await resolveEndpoint(route);
      routeCache.set(key, { ok: true, expires: Date.now() + ROUTE_TTL });
      return true;
    } catch {
      routeCache.set(key, { ok: false, expires: Date.now() + 30_000 });
    }
  }
  return false;
}

async function collect(
  logicalId: string,
  inputs: Record<string, unknown> | unknown[],
  onStatus?: (message: string) => void,
  preferredEndpoint?: string,
) {
  const candidates = ROUTES[logicalId] ?? [];
  if (!candidates.length) throw new Error(`No free route is configured for ${logicalId}.`);
  let lastError: unknown = null;
  for (const route of [...candidates].sort((a, b) => b.priority - a.priority)) {
    const key = `${logicalId}:${route.space}`;
    const cached = routeCache.get(key);
    if (cached && cached.expires > Date.now() && !cached.ok) continue;
    try {
      onStatus?.("Finding the best available engine…");
      const { client, endpoint } = await resolveEndpoint(route, preferredEndpoint);
      routeCache.set(key, { ok: true, expires: Date.now() + ROUTE_TTL });
      const normalized = await normalizeInputs(
        adaptInputs(logicalId, route.space, endpoint, inputs),
      );
      const job = client.submit(endpoint, normalized);
      let latest: unknown = null;
      for await (const message of job) {
        if (message.type === "status") {
          const status = message.status as Record<string, unknown> | undefined;
          if (status?.message && typeof status.message === "string") onStatus?.(status.message);
        }
        if (message.type === "data") latest = message.data ?? null;
      }
      if (latest == null) throw new Error("The selected engine returned no result.");
      return latest;
    } catch (error) {
      lastError = error;
      routeCache.set(key, { ok: false, expires: Date.now() + 30_000 });
      onStatus?.("The selected engine was unavailable; Buddy is continuing automatically…");
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("No free public generation route is currently available.");
}

export async function runGradio(
  space: string,
  apiName: string,
  inputs: Record<string, unknown> | unknown[],
  onStatus?: (message: string) => void,
) {
  const logicalId = Object.prototype.hasOwnProperty.call(ROUTES, space)
    ? space
    : (Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "");
  if (logicalId) return firstOutput(await collect(logicalId, inputs, onStatus, apiName));
  return firstOutput(await collectDirect(space, apiName, inputs));
}

export async function runGradioAll(
  space: string,
  apiName: string,
  inputs: Record<string, unknown> | unknown[],
  onStatus?: (message: string) => void,
) {
  const logicalId = Object.prototype.hasOwnProperty.call(ROUTES, space)
    ? space
    : (Object.entries(FREE_SPACE_IDS).find(([, value]) => value === space)?.[0] ?? "");
  const latest = logicalId
    ? await collect(logicalId, inputs, onStatus, apiName)
    : await collectDirect(space, apiName, inputs);
  if (Array.isArray(latest)) return latest;
  if (latest && typeof latest === "object" && Array.isArray((latest as { data?: unknown }).data))
    return (latest as { data: unknown[] }).data;
  return [firstOutput(latest)];
}

async function collectDirect(
  space: string,
  apiName: string,
  inputs: Record<string, unknown> | unknown[],
) {
  const client = await connectFreeSpace(space);
  const normalized = await normalizeInputs(inputs);
  const job = client.submit(apiName, normalized);
  let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The creation service returned no result.");
  return latest;
}

export const FREE_SPACE_IDS = {
  music: "music",
  image: "image",
  video: "video",
  voiceClone: "voiceClone",
  voicePreset: "voicePreset",
  voiceSwap: "voiceSwap",
  vocalSeparation: "vocalSeparation",
} as const;
