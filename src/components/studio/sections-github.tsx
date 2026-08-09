import { useCallback, useEffect, useState } from "react";
import { Github } from "lucide-react";
import { Note, Panel, Readout, StudioButton } from "@/components/studio/ui";
import { ErrorNote, SignInPrompt, Spinner } from "@/components/studio/AiOutput";
import { useAuth } from "@/hooks/use-auth";
import { getRepo, listRepos } from "@/lib/github.functions";

type Repos = Awaited<ReturnType<typeof listRepos>>;
type Activity = Awaited<ReturnType<typeof getRepo>>;

/* 21 — GitHub repository dashboard */
export function GithubPanel() {
  const { user } = useAuth();
  const [repos, setRepos] = useState<Repos | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRepos(await listRepos());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach GitHub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const open = async (fullName: string) => {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) return;
    setSelected(fullName);
    setActivity(null);
    setError(null);
    try {
      setActivity(await getRepo({ data: { owner, repo } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that repository.");
    }
  };

  return (
    <Panel id="github-repos" eyebrow="Module 21" title="GitHub Repositories" icon={<Github className="size-5" />}>
      {!user ? (
        <SignInPrompt />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StudioButton disabled={loading} onClick={() => void load()}>
              {loading ? "Refreshing…" : "Refresh repositories"}
            </StudioButton>
          </div>
          {loading && !repos && <Spinner label="Talking to GitHub" />}
          {error && <ErrorNote message={error} />}

          {repos && repos.length === 0 && <Note>No repositories found on the connected GitHub account.</Note>}

          {repos && repos.length > 0 && (
            <div className="grid gap-2">
              {repos.map((r) => (
                <button
                  key={r.fullName}
                  type="button"
                  onClick={() => void open(r.fullName)}
                  aria-pressed={selected === r.fullName}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    selected === r.fullName
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-background/50 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-sm">{r.fullName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.private ? "private" : "public"} · ★ {r.stars}
                    </span>
                  </div>
                  {r.description && <div className="line-clamp-2 text-xs text-muted-foreground">{r.description}</div>}
                </button>
              ))}
            </div>
          )}

          {selected && !activity && !error && <Spinner label={`Loading ${selected}`} />}

          {activity && (
            <>
              <div className="drip-divider my-1" />
              <div className="grid grid-cols-2 gap-2">
                <Readout label="Stars" value={String(activity.repo.stars)} />
                <Readout label="Forks" value={String(activity.repo.forks)} />
                <Readout label="Open issues" value={String(activity.repo.openIssues)} />
                <Readout label="Branch" value={activity.repo.defaultBranch} />
              </div>

              <h3 className="font-display text-sm text-primary">Open issues &amp; pull requests</h3>
              {activity.issues.length === 0 ? (
                <Note>Nothing open right now.</Note>
              ) : (
                <div className="grid gap-1.5">
                  {activity.issues.map((i) => (
                    <a
                      key={i.id}
                      href={i.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs hover:bg-secondary/40"
                    >
                      <span className="text-primary">#{i.number}</span> {i.title}
                      <span className="block text-muted-foreground">
                        {i.isPullRequest ? "pull request" : "issue"} · @{i.author}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <h3 className="font-display text-sm text-primary">Recent commits</h3>
              {activity.commits.length === 0 ? (
                <Note>No commits yet.</Note>
              ) : (
                <div className="grid gap-1.5">
                  {activity.commits.map((c) => (
                    <a
                      key={c.sha}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs hover:bg-secondary/40"
                    >
                      <span className="text-primary">{c.sha}</span> {c.message}
                      <span className="block text-muted-foreground">
                        @{c.author}
                        {c.date ? ` · ${new Date(c.date).toLocaleDateString()}` : ""}
                      </span>
                    </a>
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
