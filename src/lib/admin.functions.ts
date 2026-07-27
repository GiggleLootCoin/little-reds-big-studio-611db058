import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: SupabaseLike; userId: string };
type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only the founder account can use moderation tools.");
}

/** Founder-only: the newest community content plus the moderation audit trail. */
export const getModerationQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = context.supabase;

    const [tracks, comments, log] = await Promise.all([
      db
        .from("tracks")
        .select("id, title, description, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("comments")
        .select("id, body, created_at, user_id, track_id")
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("moderation_log")
        .select("id, action, target_type, target_label, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const authorIds = Array.from(
      new Set([...(tracks.data ?? []), ...(comments.data ?? [])].map((r) => r.user_id)),
    );
    const { data: profiles } = authorIds.length
      ? await db.from("profiles").select("id, handle, display_name").in("id", authorIds)
      : { data: [] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    return {
      tracks: (tracks.data ?? []).map((t) => ({ ...t, author: byId.get(t.user_id)?.handle ?? "unknown" })),
      comments: (comments.data ?? []).map((c) => ({ ...c, author: byId.get(c.user_id)?.handle ?? "unknown" })),
      log: log.data ?? [],
    };
  });

/** Founder-only: remove a track or comment and record why. */
export const moderateRemove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetType: z.enum(["track", "comment"]),
        targetId: z.string().uuid(),
        targetLabel: z.string().default(""),
        reason: z.string().max(300).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const table = data.targetType === "track" ? "tracks" : "comments";

    const { error } = await context.supabase.from(table).delete().eq("id", data.targetId);
    if (error) throw new Error(error.message);

    await context.supabase.from("moderation_log").insert({
      moderator_id: context.userId,
      action: "remove",
      target_type: data.targetType,
      target_id: data.targetId,
      target_label: data.targetLabel.slice(0, 140),
      reason: data.reason,
    });

    return { ok: true };
  });

/** Founder-only: studio-wide usage analytics and the most recent model-run logs. */
export const getStudioAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = context.supabase;
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    const [creators, tracksTotal, comments, follows, runsWeek, recentRuns] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("tracks").select("id", { count: "exact", head: true }),
      db.from("comments").select("id", { count: "exact", head: true }),
      db.from("follows").select("artist_id", { count: "exact", head: true }),

      db.from("plugin_runs").select("status, duration_ms, plugin_slug").gte("created_at", weekAgo),
      db
        .from("plugin_runs")
        .select("id, plugin_slug, capability, status, duration_ms, error, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const week = runsWeek.data ?? [];
    const succeeded = week.filter((r) => r.status === "succeeded");
    const failed = week.filter((r) => r.status === "failed");
    const avgMs = succeeded.length
      ? Math.round(succeeded.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / succeeded.length)
      : 0;

    const perPlugin = new Map<string, { runs: number; ok: number }>();
    for (const r of week) {
      const e = perPlugin.get(r.plugin_slug) ?? { runs: 0, ok: 0 };
      e.runs += 1;
      if (r.status === "succeeded") e.ok += 1;
      perPlugin.set(r.plugin_slug, e);
    }

    return {
      totals: {
        creators: creators.count ?? 0,
        tracks: tracksTotal.count ?? 0,
        comments: comments.count ?? 0,
        follows: follows.count ?? 0,
      },
      week: {
        runs: week.length,
        succeeded: succeeded.length,
        failed: failed.length,
        successRate: week.length ? Math.round((succeeded.length / week.length) * 100) : 0,
        avgSeconds: Math.round(avgMs / 100) / 10,
      },
      perPlugin: Array.from(perPlugin, ([slug, v]) => ({ slug, ...v })).sort((a, b) => b.runs - a.runs),
      recentRuns: recentRuns.data ?? [],
    };
  });
