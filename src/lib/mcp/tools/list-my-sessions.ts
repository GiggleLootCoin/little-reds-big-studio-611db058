import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, notAuthenticated, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_sessions",
  title: "List my studio sessions",
  description:
    "List the signed-in creator's Little Red's Big Studio sessions (projects), newest first, with their titles and which assets they already contain.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("projects")
      .select("id, title, lyrics, critique, storyboard, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return errorResult(error.message);

    const sessions = (data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      updated_at: p.updated_at,
      has_lyrics: Boolean(p.lyrics),
      has_critique: Boolean(p.critique),
      has_storyboard: Boolean(p.storyboard),
    }));

    return textResult(
      sessions.length ? JSON.stringify(sessions, null, 2) : "No studio sessions yet.",
      { sessions },
    );
  },
});
