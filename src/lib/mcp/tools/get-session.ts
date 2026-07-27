import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthenticated, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_session",
  title: "Get a studio session",
  description:
    "Read one of the signed-in creator's studio sessions in full: lyrics, AI critique, storyboard and YouTube SEO metadata.",
  inputSchema: { session_id: z.string().uuid().describe("The session id from list_my_sessions.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ session_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("projects")
      .select("id, title, lyrics, critique, storyboard, seo, updated_at")
      .eq("id", session_id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("No session with that id belongs to you.");
    return textResult(JSON.stringify(data, null, 2), { session: data });
  },
});
