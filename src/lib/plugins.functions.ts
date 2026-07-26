import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public catalog + availability of every registered model plugin. */
export const listPlugins = createServerFn({ method: "GET" }).handler(async () => {
  const { readPluginCatalog } = await import("./plugins.registry.server");
  return await readPluginCatalog();
});

/** Runs the best available plugin for a capability (or a specific one). */
export const runPluginJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        capability: z.enum(["video", "voice", "stems", "image"]),
        slug: z.string().optional(),
        payload: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { executeBestPlugin } = await import("./plugins.registry.server");
    return await executeBestPlugin({
      capability: data.capability,
      slug: data.slug,
      payload: data.payload,
      userId: context.userId,
    });
  });

/** Admin: add or update a plugin (this is how future models get plugged in). */
export const savePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().min(2),
        name: z.string().min(2),
        capability: z.enum(["video", "voice", "stems", "image", "text"]),
        provider: z.enum(["replicate", "huggingface", "fal", "lovable"]),
        model_ref: z.string().min(2),
        secret_name: z.string().nullable().default("REPLICATE_API_TOKEN"),
        quality: z.number().min(0).max(100).default(75),
        speed: z.number().min(0).max(100).default(75),
        enabled: z.boolean().default(true),
        notes: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("model_plugins")
      .upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: enable/disable a plugin without deleting it. */
export const togglePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string(), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("model_plugins")
      .update({ enabled: data.enabled })
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Recomputes this week's winners from real run telemetry. */
export const refreshPluginScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { refreshScores, readPluginCatalog } = await import("./plugins.registry.server");
    await refreshScores();
    return await readPluginCatalog();
  });
