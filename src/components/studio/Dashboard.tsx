import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Clapperboard, Mic2, UploadCloud, Zap } from "lucide-react";
import { listPlugins } from "@/lib/plugins.functions";
import { useStudio } from "@/lib/studio-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Plugin = Awaited<ReturnType<typeof listPlugins>>[number];

/** Backend readiness watcher. Deliberately renders nothing: engine/model/provider details never belong in the Studio UI. */
export function EngineStatusStrip() {
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  useEffect(() => {
    let alive = true;
    listPlugins().then((p) => alive && setPlugins(p)).catch(() => alive && setPlugins([]));
    return () => { alive = false; };
  }, []);
  void plugins;
  return null;
}

export function NextMoves({ onJump }: { onJump: (id: string) => void }) {
  const studio = useStudio();
  const { user } = useAuth();
  const steps = [
    { id: "audio-voice-file-uploads", icon: <UploadCloud className="size-4" />, title: "Bring in your track", body: "Add a song, image or voice reference to get started.", done: Boolean(studio.audioUrl) },
    { id: "elite-lyrics-voice-cloning", icon: <Mic2 className="size-4" />, title: "Make the words yours", body: "Write, generate or refine lyrics with Buddy.", done: Boolean(studio.lyrics) },
    { id: "honest-critiquer-ai-song-coach", icon: <Brain className="size-4" />, title: "Get Buddy's creative take", body: "Turn your idea into a practical upgrade plan.", done: false },
    { id: "automated-storyboarding", icon: <Clapperboard className="size-4" />, title: "Bring it to life", body: "Turn your music and imagery into a video plan.", done: Boolean(studio.storyboard) },
  ];
  return <div className="space-y-2">
    {!user && <p className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-xs text-muted-foreground"><a href="/auth" className="font-semibold text-primary underline">Sign in</a>{" "}to save your projects across sessions.</p>}
    {steps.map((s, i) => <button key={s.id} type="button" onClick={() => onJump(s.id)} className={cn("hover-lift flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", s.done ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background/50 hover:bg-secondary/40")}>
      <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.done ? "crimson-gloss text-primary-foreground" : "border border-border text-primary")}>{s.done ? <CheckCircle2 className="size-4" /> : s.icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-display text-sm font-semibold">{i + 1}. {s.title}</span><span className="block truncate text-xs text-muted-foreground">{s.body}</span></span>
      <Zap aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </button>)}
  </div>;
}
