import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, notAuthenticated, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my creator profile",
  description:
    "Read the signed-in creator's Little Red's Big Studio profile: handle, display name, about text and follower count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const db = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;

    const [{ data: profile, error }, { count }] = await Promise.all([
      db.from("profiles").select("handle, display_name, about, created_at").eq("id", userId).maybeSingle(),
      db.from("follows").select("artist_id", { count: "exact", head: true }).eq("artist_id", userId),
    ]);
    if (error) return errorResult(error.message);
    if (!profile) return errorResult("No profile found for your account yet.");

    const result = { ...profile, followers: count ?? 0 };
    return textResult(JSON.stringify(result, null, 2), { profile: result });
  },
});
