import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  CircleDashed,
  Clapperboard,
  ExternalLink,
  Mic2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { listPlugins } from "@/lib/plugins.functions";
import { runnersFor } from "@/lib/free-runners";
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

/** Honest engine status: local/open routes count as usable even without a hosted provider. */
export function EngineStatusStrip() {
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    listPlugins()
      .then((p) => alive && setPlugins(p))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        Free routes are available below even if the engine registry is temporarily unavailable.
      </p>
    );
  }

  const state = (cap: string) => {
    if (!plugins) return null;
    const live = plugins.find((p) => p.capability === cap && p.available);
    if (live) return { ok: true, text: live.name, external: false };
    const free = runnersFor(cap);
    if (free.length) return { ok: true, text: `Free: ${free[0].name}`, external: true };
    return { ok: false, text: "Unavailable", external: false };
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.keys(CAPABILITY_LABELS).map((cap) => {
        const s = state(cap);
        return (
          <div
            key={cap}
            className={cn(
              "rounded-xl border p-2.5 transition-colors",
              s?.ok ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              {s === null ? (
                <CircleDashed
                  aria-hidden
                  className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                />
              ) : s.ok ? (
                <CheckCircle2 aria-hidden className="size-3.5 shrink-0 text-primary" />
              ) : (
                <Zap aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {CAPABILITY_LABELS[cap]}
              </span>
            </div>
            <div
              className={cn(
                "mt-1 flex items-center gap-1 truncate font-display text-xs",
                s?.ok ? "text-primary" : "text-muted-foreground",
              )}
              title={s?.text ?? "Checking…"}
            >
              {s?.text ?? "Checking…"}
              {s?.external && <ExternalLink aria-hidden className="size-3 shrink-0" />}
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
      body: "Drop an audio file or reference image to open a session.",
      done: Boolean(studio.audioUrl),
    },
    {
      id: "elite-lyrics-voice-cloning",
      icon: <Mic2 className="size-4" />,
      title: "Write or refine the words",
      body: "Draft lyrics, then polish them with the Studio's writing tools.",
      done: Boolean(studio.lyrics),
    },
    {
      id: "honest-critiquer-ai-song-coach",
      icon: <Brain className="size-4" />,
      title: "Get the honest critique",
      body: "Build a ranked upgrade plan with mix and master targets.",
      done: false,
    },
    {
      id: "automated-storyboarding",
      icon: <Clapperboard className="size-4" />,
      title: "Storyboard the video",
      body: "Map scene-by-scene shots to your beat grid.",
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
          to save projects, tracks and runs to your account. Free/local tools do not require a
          provider key.
        </p>
      )}
      {steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onJump(s.id)}
          className={cn(
            "hover-lift flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
            s.done
              ? "border-primary/40 bg-primary/10"
              : "border-border/70 bg-background/50 hover:bg-secondary/40",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              s.done
                ? "crimson-gloss text-primary-foreground"
                : "border border-border text-primary",
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
