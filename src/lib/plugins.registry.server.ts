import {
  buildInput,
  describeAvailability,
  extractMedia,
  invokePlugin,
  rankPlugins,
} from "./plugins.server";
import type { Capability, PluginStatus } from "./plugins.server";
import { OPEN_MODEL_CATALOG } from "./open-models.catalog";
import { runnersFor } from "./free-runners";

/** Provider-free model registry. */
const sessionRuns: Array<{
  slug: string;
  capability: Capability;
  status: "succeeded" | "failed" | "handoff";
  durationMs: number;
}> = [];

export async function readPluginCatalog(): Promise<PluginStatus[]> {
  return rankPlugins(OPEN_MODEL_CATALOG.map(describeAvailability));
}

export type PublicPlugin = {
  slug: string;
  name: string;
  capability: string;
  quality: number;
  speed: number;
  enabled: boolean;
  available: boolean;
  reason: string;
  runtime: string;
  projectUrl: string;
};

export async function readPublicPluginCatalog(): Promise<PublicPlugin[]> {
  const catalog = await readPluginCatalog();
  return catalog.map((p) => ({
    slug: p.slug,
    name: p.name,
    capability: p.capability,
    quality: p.quality,
    speed: p.speed,
    enabled: p.enabled,
    available: p.available,
    reason: p.reason,
    runtime: p.runtime,
    projectUrl: p.project_url,
  }));
}

export async function refreshScores() {
  return undefined;
}

export function getSessionRunStats() {
  return [...sessionRuns];
}

export type PluginJobResult = {
  plugin: string;
  slug: string;
  media: string[];
  raw: unknown;
  handoff?: boolean;
  runnerUrl?: string;
  runnerName?: string;
  message?: string;
};

function getFreeRunnerHandoff(capability: Capability) {
  const runner = runnersFor(capability)[0];
  if (!runner) return undefined;
  return {
    handoff: true,
    runnerUrl: runner.url,
    runnerName: runner.name,
    message:
      "This heavy open model cannot execute inside the hosted Studio without a paid/API inference service. Open the free runner to run the job without an API key.",
  };
}

export async function executeBestPlugin(args: {
  capability: Capability;
  slug?: string;
  payload: Record<string, unknown>;
  userId?: string;
}): Promise<PluginJobResult> {
  const catalog = await readPluginCatalog();
  const pool = catalog.filter((p) => p.capability === args.capability && p.enabled);
  const chosen = args.slug ? pool.find((p) => p.slug === args.slug) : pool.find((p) => p.available);

  if (!chosen) {
    const names = pool.map((p) => p.name).join(", ") || "none registered";
    throw new Error(`No free/open ${args.capability} model is registered. Available: ${names}.`);
  }

  if (!chosen.available) {
    const handoff = getFreeRunnerHandoff(args.capability);
    if (!handoff) throw new Error(`${chosen.name}: ${chosen.reason}`);
    sessionRuns.push({ slug: chosen.slug, capability: args.capability, status: "handoff", durationMs: 0 });
    return { plugin: chosen.name, slug: chosen.slug, media: [], raw: null, ...handoff };
  }

  const started = Date.now();
  try {
    const output = await invokePlugin(chosen, buildInput(args.capability, args.payload));
    const media = extractMedia(output);
    sessionRuns.push({
      slug: chosen.slug,
      capability: args.capability,
      status: "succeeded",
      durationMs: Date.now() - started,
    });
    return { plugin: chosen.name, slug: chosen.slug, media, raw: output };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    sessionRuns.push({
      slug: chosen.slug,
      capability: args.capability,
      status: "failed",
      durationMs: Date.now() - started,
    });
    throw new Error(`${chosen.name} failed: ${message}`);
  }
}
