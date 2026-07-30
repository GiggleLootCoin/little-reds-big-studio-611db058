import { buildInput, describeAvailability, extractMedia, invokePlugin, rankPlugins } from "./plugins.server";
import type { Capability, PluginRow, PluginStatus } from "./plugins.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readPluginCatalog(): Promise<PluginStatus[]> {
  const db = await admin();
  const { data, error } = await db
    .from("model_plugins")
    .select("*")
    .order("capability", { ascending: true });
  if (error) throw new Error(error.message);
  return rankPlugins((data as PluginRow[]).map(describeAvailability));
}

/** Safe, non-sensitive projection of the catalog for unauthenticated callers. */
export type PublicPlugin = {
  slug: string;
  name: string;
  capability: string;
  quality: number;
  speed: number;
  enabled: boolean;
  available: boolean;
  reason: string;
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
    reason: p.available
      ? "Ready"
      : p.enabled
        ? "Awaiting provider activation"
        : "Disabled in the registry",
  }));
}

export async function refreshScores() {
  const db = await admin();
  const { error } = await db.rpc("refresh_plugin_weekly_scores");
  if (error) throw new Error(error.message);
}

export async function executeBestPlugin(args: {
  capability: Capability;
  slug?: string;
  payload: Record<string, unknown>;
  userId: string;
}) {
  const db = await admin();
  const catalog = await readPluginCatalog();
  const pool = catalog.filter((p) => p.capability === args.capability);
  const chosen = args.slug
    ? pool.find((p) => p.slug === args.slug)
    : pool.find((p) => p.available);

  if (!chosen) {
    const names = pool.map((p) => p.name).join(", ") || "none registered";
    throw new Error(
      `No ${args.capability} plugin is active yet. Registered: ${names}. Add the provider key in the Model Plugins module to switch it on.`,
    );
  }
  if (!chosen.available) throw new Error(`${chosen.name}: ${chosen.reason}`);

  const started = Date.now();
  const { data: run } = await db
    .from("plugin_runs")
    .insert({
      user_id: args.userId,
      plugin_slug: chosen.slug,
      capability: args.capability,
      input: args.payload as never,
    })
    .select("id")
    .single();

  try {
    const output = await invokePlugin(chosen, buildInput(args.capability, args.payload));
    const media = extractMedia(output);
    if (run) {
      await db
        .from("plugin_runs")
        .update({
          status: "succeeded",
          duration_ms: Date.now() - started,
          output: { media } as never,
        })
        .eq("id", run.id);
    }
    await refreshScores();
    return { plugin: chosen.name, slug: chosen.slug, media, raw: output };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (run) {
      await db
        .from("plugin_runs")
        .update({ status: "failed", duration_ms: Date.now() - started, error: message })
        .eq("id", run.id);
    }
    await refreshScores();
    throw new Error(`${chosen.name} failed: ${message}`);
  }
}
