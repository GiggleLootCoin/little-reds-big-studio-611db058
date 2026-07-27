import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthenticated, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "save_session",
  title: "Create or update a studio session",
  description:
    "Create a new studio session, or update an existing one, for the signed-in creator. Use it to save lyrics, a critique or a storyboard written with the assistant so they appear in the studio app.",
  inputSchema: {
    session_id: z
      .string()
      .uuid()
      .nullable()
      .describe("Existing session id to update, or null to create a new session."),
    title: z.string().trim().min(1).max(120).nullable().describe("Session title, or null to leave unchanged."),
    lyrics: z.string().nullable().describe("Full lyrics text, or null to leave unchanged."),
    critique: z.string().nullable().describe("Song critique text, or null to leave unchanged."),
    storyboard: z.string().nullable().describe("Scene-by-scene storyboard text, or null to leave unchanged."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ session_id, title, lyrics, critique, storyboard }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const db = supabaseForUser(ctx);

    const patch: Record<string, string> = {};
    if (title !== null) patch.title = title;
    if (lyrics !== null) patch.lyrics = lyrics;
    if (critique !== null) patch.critique = critique;
    if (storyboard !== null) patch.storyboard = storyboard;

    if (session_id) {
      if (Object.keys(patch).length === 0) return errorResult("Nothing to update — every field was null.");
      const { data, error } = await db
        .from("projects")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", session_id)
        .select("id, title")
        .maybeSingle();
      if (error) return errorResult(error.message);
      if (!data) return errorResult("No session with that id belongs to you.");
      return textResult(`Updated session "${data.title}".`, { session: data });
    }

    const { data, error } = await db
      .from("projects")
      .insert({ user_id: ctx.getUserId()!, title: patch.title ?? "Untitled Session", ...patch })
      .select("id, title")
      .maybeSingle();
    if (error) return errorResult(error.message);
    return textResult(`Created session "${data?.title}" (${data?.id}).`, { session: data });
  },
});
