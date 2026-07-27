import { useCallback, useEffect, useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { Note, Panel, Readout, StudioButton } from "@/components/studio/ui";
import { ErrorNote, SignInPrompt, Spinner, useAsyncAction } from "@/components/studio/AiOutput";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getModerationQueue, getStudioAnalytics, moderateRemove } from "@/lib/admin.functions";

function useIsAdmin() {
  const { user, ready } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setChecked(ready);
      return;
    }
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(Boolean(data));
        setChecked(true);
      });
  }, [user, ready]);

  return { user, isAdmin, checked };
}

type Queue = Awaited<ReturnType<typeof getModerationQueue>>;

/* 19 — Admin moderation */
export function ModerationPanel() {
  const { user, isAdmin, checked } = useIsAdmin();
  const [queue, setQueue] = useState<Queue | null>(null);
  const action = useAsyncAction<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQueue(await getModerationQueue());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the moderation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const remove = (targetType: "track" | "comment", targetId: string, targetLabel: string) =>
    void action.run(async () => {
      const reason = window.prompt(`Why are you removing this ${targetType}?`) ?? "";
      await moderateRemove({ data: { targetType, targetId, targetLabel, reason } });
      await load();
      return `Removed the ${targetType} and logged the reason.`;
    });

  return (
    <Panel eyebrow="Module 19" title="Admin Moderation" icon={<ShieldCheck className="size-5" />}>
      {!user ? (
        <SignInPrompt />
      ) : !isAdmin ? (
        <Note>{checked ? "Moderation tools are reserved for the founder account." : "Checking your access…"}</Note>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StudioButton disabled={loading} onClick={() => void load()}>
              {loading ? "Refreshing…" : "Refresh queue"}
            </StudioButton>
          </div>
          {loading && !queue && <Spinner label="Loading community content" />}
          {error && <ErrorNote message={error} />}
          {action.error && <ErrorNote message={action.error} />}
          {action.result && <Note>{action.result}</Note>}

          {queue && (
            <>
              <h3 className="font-display text-sm text-primary">Newest tracks</h3>
              {queue.tracks.length === 0 && <Note>No tracks in the feed yet.</Note>}
              <div className="grid gap-2">
                {queue.tracks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm">{t.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{t.author} · {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <StudioButton variant="ghost" onClick={() => remove("track", t.id, t.title)}>
                      Remove
                    </StudioButton>
                  </div>
                ))}
              </div>

              <div className="drip-divider my-1" />
              <h3 className="font-display text-sm text-primary">Newest comments</h3>
              {queue.comments.length === 0 && <Note>No comments yet.</Note>}
              <div className="grid gap-2">
                {queue.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm">{c.body}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{c.author} · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <StudioButton variant="ghost" onClick={() => remove("comment", c.id, c.body.slice(0, 60))}>
                      Remove
                    </StudioButton>
                  </div>
                ))}
              </div>

              <div className="drip-divider my-1" />
              <h3 className="font-display text-sm text-primary">Moderation log</h3>
              {queue.log.length === 0 ? (
                <Note>Nothing has been removed yet.</Note>
              ) : (
                <div className="grid gap-1.5">
                  {queue.log.map((l) => (
                    <div key={l.id} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs">
                      <span className="text-primary">{l.action}</span> {l.target_type} “{l.target_label}”
                      {l.reason && <span className="text-muted-foreground"> — {l.reason}</span>}
                      <span className="block text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Panel>
  );
}

type Analytics = Awaited<ReturnType<typeof getStudioAnalytics>>;

/* 20 — Analytics & logs */
export function AnalyticsPanel() {
  const { user, isAdmin, checked } = useIsAdmin();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getStudioAnalytics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  return (
    <Panel eyebrow="Module 20" title="Analytics & Engine Logs" icon={<Activity className="size-5" />}>
      {!user ? (
        <SignInPrompt />
      ) : !isAdmin ? (
        <Note>{checked ? "Studio analytics are reserved for the founder account." : "Checking your access…"}</Note>
      ) : (
        <>
          <StudioButton disabled={loading} onClick={() => void load()}>
            {loading ? "Refreshing…" : "Refresh analytics"}
          </StudioButton>
          {loading && !data && <Spinner label="Crunching the numbers" />}
          {error && <ErrorNote message={error} />}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Readout label="Creators" value={String(data.totals.creators)} />
                <Readout label="Tracks shared" value={String(data.totals.tracks)} />
                <Readout label="Comments" value={String(data.totals.comments)} />
                <Readout label="Follows" value={String(data.totals.follows)} />
              </div>

              <div className="drip-divider my-1" />
              <h3 className="font-display text-sm text-primary">Last 7 days of model runs</h3>
              <div className="grid grid-cols-2 gap-2">
                <Readout label="Runs" value={String(data.week.runs)} />
                <Readout label="Success rate" value={`${data.week.successRate}%`} />
                <Readout label="Failed" value={String(data.week.failed)} />
                <Readout label="Avg duration" value={`${data.week.avgSeconds}s`} />
              </div>

              {data.perPlugin.length > 0 && (
                <div className="grid gap-1.5">
                  {data.perPlugin.map((p) => (
                    <div
                      key={p.slug}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-xs"
                    >
                      <span className="truncate">{p.slug}</span>
                      <span className="text-muted-foreground">
                        {p.ok}/{p.runs} ok
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="drip-divider my-1" />
              <h3 className="font-display text-sm text-primary">Recent engine logs</h3>
              {data.recentRuns.length === 0 ? (
                <Note>No model runs recorded yet.</Note>
              ) : (
                <div className="grid gap-1.5">
                  {data.recentRuns.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {r.capability} · {r.plugin_slug}
                        </span>
                        <span className={r.status === "failed" ? "text-destructive" : "text-primary"}>{r.status}</span>
                      </div>
                      {r.error && <div className="truncate text-muted-foreground">{r.error}</div>}
                      <div className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Panel>
  );
}
