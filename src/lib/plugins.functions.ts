import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  executeBestPlugin,
  readPublicPluginCatalog,
  refreshScores,
} from "./plugins.registry.server";

export type { PublicPlugin } from "./plugins.registry.server";

export type ClientPluginJobResult = {
  plugin: string;
  slug: string;
  media: string[];
  handoff?: boolean;
  runnerUrl?: string;
  runnerName?: string;
  message?: string;
};

export const listPlugins = createServerFn({ method: "GET" }).handler(async () =>
  readPublicPluginCatalog(),
);

export const runPluginJob = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        capability: z.enum(["video", "voice", "stems", "image", "music", "text"]),
        slug: z.string().optional(),
        payload: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ClientPluginJobResult> => {
    const result = await executeBestPlugin({
      capability: data.capability,
      slug: data.slug,
      payload: data.payload,
      userId: "local",
    });
    return {
      plugin: result.plugin,
      slug: result.slug,
      media: result.media,
      handoff: result.handoff,
      runnerUrl: result.runnerUrl,
      runnerName: result.runnerName,
      message: result.message,
    };
  });

export const savePlugin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        slug: z.string().min(2),
        name: z.string().min(2),
        capability: z.enum(["video", "voice", "stems", "image", "text", "music"]),
        model_ref: z.string().min(2),
        quality: z.number().min(0).max(100).default(75),
        speed: z.number().min(0).max(100).default(75),
        enabled: z.boolean().default(true),
        notes: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => ({
    ok: true,
    catalogEntry: data,
    message: "Open-model catalog is source-controlled; edit open-models.catalog.ts to add a model.",
  }));

export const togglePlugin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ slug: z.string(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data }) => ({ ok: true, slug: data.slug, enabled: data.enabled }));

export const refreshPluginScores = createServerFn({ method: "POST" }).handler(async () => {
  await refreshScores();
  return readPublicPluginCatalog();
});
