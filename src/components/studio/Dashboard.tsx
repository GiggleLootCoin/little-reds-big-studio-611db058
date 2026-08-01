import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  CircleDashed,
  Clapperboard,
  KeyRound,
  Mic2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { listPlugins } from "@/lib/plugins.functions";
import { useStudio } from "@/lib/studio-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Plugin = Awaited<ReturnType<typeof listPlugins>>[number];

const CAPABILITY_LABELS: Record<string, string> = {
  text: "Writing & Council",
  voice: "Voice",
  music: "Music",
  stems: "Stem separation",
  image: "Artwork",
  video: "Video",
};

/** Honest, live engine status — never shows a capability as ready unless a plugin really is. */
export function EngineStatusStrip() {
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listPlugins()
      .then((p) => alive && setPlugins(p))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
        Engine registry unreachable: {error}
      </p>
    );
  }

  const caps = Object.keys(CAPABILITY_LABELS);
  const state = (cap: string) => {
    if (!plugins) return null;
    const pool = plugins.filter((p) => p.capability === cap);
    if (!pool.length) return { ok: false, text: "Not registered" };
    const live = pool.find((p) => p.available);
    return live ? { ok: true, text: live.name } : { ok: false, text: "Needs provider key" };
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {caps.map((cap) => {
        const s = state(cap);
        return (
          <div
            key={cap}
            className={cn(
              "rounded-xl border p-2.5 transition-colors",
              s?.ok
                ? "border-primary/40 bg-primary/10"
                : "border-border/70 bg-background/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              {s === null ? (
                <CircleDashed aria-hidden className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : s.ok ? (
                <CheckCircle2 aria-hidden className="size-3.5 shrink-0 text-primary" />
              ) : (
                <KeyRound aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {CAPABILITY_LABELS[cap]}
              </span>
            </div>
            <div
              className={cn(
                "mt-1 truncate font-display text-xs",
                s?.ok ? "text-primary" : "text-muted-foreground",
              )}
              title={s?.text ?? "Checking…"}
            >
              {s?.text ?? "Checking…"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Guided "what do I do next" flow, driven by real session state. */
export function NextMoves({ onJump }: { onJump: (id: string) => void }) {
  const studio = useStudio();
  const { user } = useAuth();

  const steps = [
    {
      id: "audio-voice-file-uploads",
      icon: <UploadCloud className="size-4" />,
      title: "Bring in your track",
      body: "Drop an audio file (or a reference image) to open a session.",
      done: Boolean(studio.audioUrl),
    },
    {
      id: "elite-lyrics-voice-cloning",
      icon: <Mic2 className="size-4" />,
      title: "Write or refine the words",
      body: "Generate lyrics, then send them to the Honest Critiquer.",
      done: Boolean(studio.lyrics),
    },
    {
      id: "honest-critiquer-ai-song-coach",
      icon: <Brain className="size-4" />,
      title: "Get the honest critique",
      body: "A ranked upgrade plan with mix and master targets.",
      done: false,
    },
    {
      id: "automated-storyboarding",
      icon: <Clapperboard className="size-4" />,
      title: "Storyboard the video",
      body: "Scene-by-scene shots mapped to your beat grid.",
      done: Boolean(studio.storyboard),
    },
  ];

  return (
    <div className="space-y-2">
      {!user && (
        <p className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-xs text-muted-foreground">
          <a href="/auth" className="font-semibold text-primary underline">
            Sign in
          </a>{" "}
          to unlock the AI engines — sessions, tracks and runs save to your account.
        </p>
      )}
      {steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onJump(s.id)}
          className={cn(
            "hover-lift flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
            s.done ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background/50 hover:bg-secondary/40",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              s.done ? "crimson-gloss text-primary-foreground" : "border border-border text-primary",
            )}
          >
            {s.done ? <CheckCircle2 className="size-4" /> : s.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-semibold">
              {i + 1}. {s.title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{s.body}</span>
          </span>
          <Zap aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
