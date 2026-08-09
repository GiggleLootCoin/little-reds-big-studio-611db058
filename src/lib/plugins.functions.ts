import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listPlugins = createServerFn({ method: "GET" }).handler(async () => {
  const { readPublicPluginCatalog } = await import("./plugins.registry.server");
  return readPublicPluginCatalog();
});

export const runPluginJob = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ capability: z.enum(["video", "voice", "stems", "image", "music", "text"]), slug: z.string().optional(), payload: z.record(z.string(), z.unknown()).default({}) }).parse(input))
  .handler(async ({ data }) => {
    const { executeBestPlugin } = await import("./plugins.registry.server");
    return executeBestPlugin({ capability: data.capability, slug: data.slug, payload: data.payload, userId: "local" });
  });

export const savePlugin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ slug: z.string().min(2), name: z.string().min(2), capability: z.enum(["video", "voice", "stems", "image", "text", "music"]), model_ref: z.string().min(2), quality: z.number().min(0).max(100).default(75), speed: z.number().min(0).max(100).default(75), enabled: z.boolean().default(true), notes: z.string().default("") }).parse(input))
  .handler(async ({ data }) => ({ ok: true, catalogEntry: data, message: "Open-model catalog is source-controlled; edit open-models.catalog.ts to add a model." }));

export const togglePlugin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ slug: z.string(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data }) => ({ ok: true, slug: data.slug, enabled: data.enabled }));

export const refreshPluginScores = createServerFn({ method: "POST" }).handler(async () => {
  const { refreshScores, readPublicPluginCatalog } = await import("./plugins.registry.server");
  refreshScores();
  return readPublicPluginCatalog();
});
