/**
 * Model plugin runtime.
 *
 * The studio keeps a registry of swappable open models (Wan, Hunyuan Video,
 * LTX Video, CogVideoX, OpenVoice, Fish Speech, Demucs, ...). Every run is
 * recorded, and the weekly score is recomputed from those real runs so the
 * studio automatically routes to whichever free model is performing best.
 */

export type Capability = "video" | "voice" | "stems" | "image" | "text";

export type PluginRow = {
  id: string;
  slug: string;
  name: string;
  capability: string;
  provider: string;
  model_ref: string;
  secret_name: string | null;
  is_free: boolean;
  quality: number;
  speed: number;
  weekly_score: number;
  enabled: boolean;
  notes: string;
};

export type PluginStatus = PluginRow & { available: boolean; reason: string };

export function secretFor(plugin: Pick<PluginRow, "provider" | "secret_name">) {
  if (plugin.provider === "lovable") return process.env.LOVABLE_API_KEY;
  if (!plugin.secret_name) return undefined;
  return process.env[plugin.secret_name];
}

export function describeAvailability(plugin: PluginRow): PluginStatus {
  const key = secretFor(plugin);
  if (!plugin.enabled) return { ...plugin, available: false, reason: "Disabled in the registry" };
  if (!key)
    return {
      ...plugin,
      available: false,
      reason: `Add the ${plugin.secret_name ?? "provider"} key to activate`,
    };
  return { ...plugin, available: true, reason: "Ready" };
}

/** Higher is better. Weekly score (real run telemetry) dominates, then quality/speed. */
export function rankPlugins(plugins: PluginStatus[]) {
  return [...plugins].sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      Number(b.weekly_score) - Number(a.weekly_score) ||
      b.quality + b.speed - (a.quality + a.speed),
  );
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

type RunInput = Record<string, unknown>;

async function runReplicate(modelRef: string, input: RunInput, token: string) {
  const isVersion = /^[0-9a-f]{40}$/i.test(modelRef);
  const url = isVersion
    ? "https://api.replicate.com/v1/predictions"
    : `https://api.replicate.com/v1/models/${modelRef}/predictions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify(isVersion ? { version: modelRef, input } : { input }),
  });

  if (!res.ok) {
    throw new Error(`Replicate rejected the job (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }

  let prediction = (await res.json()) as {
    id: string;
    status: string;
    output?: unknown;
    error?: string;
    urls?: { get?: string };
  };

  const deadline = Date.now() + 9 * 60 * 1000;
  while (["starting", "processing"].includes(prediction.status) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(
      prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    prediction = (await poll.json()) as typeof prediction;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(prediction.error || `Job ended as "${prediction.status}".`);
  }
  return prediction.output;
}

async function runHuggingFace(modelRef: string, input: RunInput, token: string) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${modelRef}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: input.prompt ?? input, parameters: input }),
  });
  if (!res.ok) {
    throw new Error(`Hugging Face rejected the job (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return await res.json();
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
}

async function runFal(modelRef: string, input: RunInput, token: string) {
  const res = await fetch(`https://fal.run/${modelRef}`, {
    method: "POST",
    headers: { Authorization: `Key ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`fal.ai rejected the job (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return await res.json();
}

async function runLovable(modelRef: string, input: RunInput, token: string) {
  const { generateGatewayImage } = await import("./ai-gateway.server");
  void modelRef;
  void token;
  return await generateGatewayImage(String(input.prompt ?? ""), input.reference as string | undefined);
}

export async function invokePlugin(plugin: PluginRow, input: RunInput) {
  const token = secretFor(plugin);
  if (!token) throw new Error(`${plugin.name} needs the ${plugin.secret_name ?? "provider"} key.`);

  switch (plugin.provider) {
    case "replicate":
      return await runReplicate(plugin.model_ref, input, token);
    case "huggingface":
      return await runHuggingFace(plugin.model_ref, input, token);
    case "fal":
      return await runFal(plugin.model_ref, input, token);
    case "lovable":
      return await runLovable(plugin.model_ref, input, token);
    default:
      throw new Error(`Unknown provider "${plugin.provider}".`);
  }
}

/** Normalises wildly different provider payloads down to usable media URLs. */
export function extractMedia(output: unknown): string[] {
  const out: string[] = [];
  const walk = (value: unknown, depth = 0) => {
    if (depth > 4 || value == null) return;
    if (typeof value === "string") {
      if (value.startsWith("http") || value.startsWith("data:")) out.push(value);
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

/** Per-capability input shaping so one call site can drive every model. */
export function buildInput(capability: Capability, payload: Record<string, unknown>): RunInput {
  switch (capability) {
    case "video":
      return {
        prompt: payload.prompt,
        ...(payload.image ? { image: payload.image, start_image: payload.image } : {}),
        num_frames: 81,
        fps: 24,
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
    case "stems":
      return {
        audio: payload.audio,
        stem: "none",
        output_format: "mp3",
      };
    case "image":
      return { prompt: payload.prompt, reference: payload.reference };
    default:
      return payload;
  }
}
