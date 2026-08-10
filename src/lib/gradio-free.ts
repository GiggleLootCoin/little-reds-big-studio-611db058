type FileLike = File | Blob | string;
type GradioMessage = { type: string; data?: unknown; status?: unknown };
type GradioJob = AsyncIterable<GradioMessage>;
type GradioClient = {
  submit: (apiName: string, inputs: unknown) => GradioJob;
  view_api?: () => Promise<unknown>;
};
type GradioModule = { Client: { connect: (space: string) => Promise<GradioClient> } };
type RouteCandidate = { space: string; endpoints: string[]; priority: number };

const GRADIO_CDN = "https://esm.sh/@gradio/client@2.3.1";
const ROUTE_TTL = 5 * 60_000;
const GRADIO_TIMEOUT = 15_000;
let modulePromise: Promise<GradioModule> | null = null;
const clients = new Map<string, Promise<GradioClient>>();
const routeCache = new Map<string, { ok: boolean; expires: number }>();

const ROUTES: Record<string, RouteCandidate[]> = {
  music: [
    {
      space: "victor/ace-step-jam",
      endpoints: ["/create", "/predict", "/generate_music"],
      priority: 140,
    },
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
    { space: "mrfakename/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 140 },
    { space: "hf-applications/Z-Image-Turbo", endpoints: ["/generate_image"], priority: 120 },
    { space: "xiaopeng/Awesome-Z-Image-Turbo", endpoints: ["/generate_image"], priority: 100 },
  ],
  video: [
    { space: "Wan-AI/Wan2.2-S2V", endpoints: ["/generate_video", "/predict"], priority: 145 },
    {
      space: "dream2589632147/Dream-wan2-2-faster-Pro",
      endpoints: ["/generate_video", "/predict"],
      priority: 140,
    },
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

async function loadGradio(): Promise<GradioModule> {
  if (!modulePromise)
    modulePromise = import(/* @vite-ignore */ GRADIO_CDN) as Promise<GradioModule>;
  return modulePromise;
}

export function connectFreeSpace(space: string) {
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
  for (const key of ["url", "path", "data", "value", "audio_url", "video_url", "image_url"]) {
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

async function resolveEndpoint(route: RouteCandidate) {
  const client = await withTimeout(connectFreeSpace(route.space), GRADIO_TIMEOUT);
  if (!client.view_api) return { client, endpoint: route.endpoints[0] };
  const info = await withTimeout(client.view_api(), GRADIO_TIMEOUT);
  const available = endpointNames(info);
  const endpoint = route.endpoints.find((candidate) => available.includes(candidate));
  if (!endpoint) throw new Error(`No compatible public endpoint found for ${route.space}.`);
  return { client, endpoint };
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
      const { client, endpoint } = await resolveEndpoint(route);
      routeCache.set(key, { ok: true, expires: Date.now() + ROUTE_TTL });
      const job = client.submit(endpoint, inputs);
      let latest: unknown = null;
      for await (const message of job) if (message.type === "data") latest = message.data ?? null;
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
  if (logicalId) return firstOutput(await collect(logicalId, inputs, onStatus));
  const client = await connectFreeSpace(space);
  const job = client.submit(apiName, inputs);
  let latest: unknown = null;
  for await (const message of job) if (message.type === "data") latest = message.data ?? null;
  if (latest == null) throw new Error("The creation service returned no result.");
  return firstOutput(latest);
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
    ? await collect(logicalId, inputs, onStatus)
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
  const job = client.submit(apiName, inputs);
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
