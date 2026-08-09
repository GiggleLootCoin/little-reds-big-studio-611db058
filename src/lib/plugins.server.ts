/**
 * Provider-free open-model runtime.
 *
 * The studio does NOT require Replicate, ElevenLabs, fal.ai, Hugging Face
 * Inference API, Lovable AI, or any other paid/API-key provider.
 *
 * Heavy models are represented as open runtimes. A runtime may be executed
 * locally (desktop/Termux), in a free Colab session, or by another explicitly
 * connected open-source runner. The registry never asks the user for an API key.
 */

export type Capability = "video" | "voice" | "stems" | "image" | "text" | "music";

export type RuntimeKind = "local" | "colab" | "browser";

export type PluginRow = {
  id: string;
  slug: string;
  name: string;
  capability: Capability;
  provider: "open-source";
  model_ref: string;
  secret_name: null;
  is_free: true;
  quality: number;
  speed: number;
  weekly_score: number;
  enabled: boolean;
  notes: string;
  runtime: RuntimeKind;
  project_url: string;
};

export type PluginStatus = PluginRow & { available: boolean; reason: string };

/** Open runtimes never require a secret/API key. */
export function secretFor(_plugin: PluginRow): undefined {
  return undefined;
}

export function describeAvailability(plugin: PluginRow): PluginStatus {
  if (!plugin.enabled) {
    return { ...plugin, available: false, reason: "Disabled in the open-model catalog" };
  }

  // Availability means the model is publicly obtainable and has a supported
  // free execution route. Actual heavy-model execution is delegated to the
  // selected runtime rather than a proprietary API.
  return {
    ...plugin,
    available: true,
    reason: `Free/open model — run via ${plugin.runtime}`,
  };
}

/** Higher is better. Weekly score dominates, then quality/speed. */
export function rankPlugins(plugins: PluginStatus[]) {
  return [...plugins].sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      Number(b.weekly_score) - Number(a.weekly_score) ||
      b.quality + b.speed - (a.quality + a.speed),
  );
}

type RunInput = Record<string, unknown>;

/**
 * Provider-free execution contract.
 *
 * The web app is deliberately not coupled to a commercial inference API.
 * A local/Colab/browser runner can register an implementation through the
 * global hook. This keeps the studio portable and makes the execution layer
 * replaceable without changing the UI or model catalog.
 */
export type OpenModelRunner = (
  plugin: PluginRow,
  input: RunInput,
) => Promise<unknown>;

const RUNNER_KEY = "__LITTLE_REDS_OPEN_MODEL_RUNNER__";

type RunnerHost = typeof globalThis & {
  [RUNNER_KEY]?: OpenModelRunner;
};

export function registerOpenModelRunner(runner: OpenModelRunner) {
  (globalThis as RunnerHost)[RUNNER_KEY] = runner;
}

export async function invokePlugin(plugin: PluginRow, input: RunInput) {
  const runner = (globalThis as RunnerHost)[RUNNER_KEY];
  if (!runner) {
    throw new Error(
      `${plugin.name} is an open model and needs a free local/Colab/browser runner. No API key or paid provider is supported.`,
    );
  }
  return runner(plugin, input);
}

/** Normalises wildly different runner payloads down to usable media URLs. */
export function extractMedia(output: unknown): string[] {
  const out: string[] = [];
  const walk = (value: unknown, depth = 0) => {
    if (depth > 4 || value == null) return;
    if (typeof value === "string") {
      if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) out.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => walk(v, depth + 1));
      return;
    }
    if (typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach((v) => walk(v, depth + 1));
    }
  };
  walk(output);
  return Array.from(new Set(out));
}

/** Per-capability input shaping shared by every open model runner. */
export function buildInput(capability: Capability, payload: Record<string, unknown>): RunInput {
  switch (capability) {
    case "video":
      return {
        prompt: payload.prompt,
        ...(payload.image ? { image: payload.image, start_image: payload.image } : {}),
        duration: payload.seconds ?? 5,
        aspect_ratio: payload.aspectRatio ?? "16:9",
      };
    case "voice":
      return {
        text: payload.text,
        ...(payload.reference ? { reference_audio: payload.reference, audio: payload.reference } : {}),
        speed: payload.speed ?? 1,
        language: payload.language ?? "en",
      };
    case "music":
      return {
        prompt: payload.prompt ?? payload.text,
        seconds: payload.seconds ?? 30,
      };
    case "stems":
      return { audio: payload.audio };
    case "image":
      return { prompt: payload.prompt, reference: payload.reference };
    case "text":
    default:
      return payload;
  }
}
