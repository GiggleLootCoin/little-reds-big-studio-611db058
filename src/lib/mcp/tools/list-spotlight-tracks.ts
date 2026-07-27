import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthenticated, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_spotlight_tracks",
  title: "List Artist Spotlight tracks",
  description:
    "List the most recent tracks shared to the public Artist Spotlight community feed, with their creator handle and love/comment counts.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).nullable().describe("How many tracks to return (default 12)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("tracks")
      .select("id, title, description, created_at, user_id, reactions(kind), comments(id)")
      .order("created_at", { ascending: false })
      .limit(limit ?? 12);
    if (error) return errorResult(error.message);

    const tracks = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      created_at: t.created_at,
      reactions: (t.reactions as unknown[] | null)?.length ?? 0,
      comments: (t.comments as unknown[] | null)?.length ?? 0,
    }));

    return textResult(
      tracks.length ? JSON.stringify(tracks, null, 2) : "The Spotlight feed is empty right now.",
      { tracks },
    );
  },
});
