import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin/founder only: grant or revoke an unlimited VIP pass by @handle. */
export const grantVip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ handle: z.string().min(1), grant: z.boolean().default(true) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Only the founder account can grant VIP passes.");

    const handle = data.handle.replace(/^@/, "").trim();
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, display_name")
      .eq("handle", handle)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error(`No creator found with the handle @${handle}.`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: profile.id, role: "vip" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.id)
        .eq("role", "vip");
      if (error) throw new Error(error.message);
    }

    return { ok: true, display_name: profile.display_name, granted: data.grant };
  });
