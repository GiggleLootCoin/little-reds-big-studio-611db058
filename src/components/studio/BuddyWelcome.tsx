import { ArrowRight, Sparkles } from "lucide-react";
import { buddyPlan, type BuddyTask } from "@/lib/buddy-orchestrator";
import { cn } from "@/lib/utils";

const TASKS: { task: BuddyTask; title: string; copy: string }[] = [
  { task: "music", title: "Make music", copy: "Turn an idea, lyric or reference into music." },
  { task: "voice", title: "Work on vocals", copy: "Transform, polish or develop a vocal." },
  { task: "stems", title: "Clean the track", copy: "Separate and prepare the parts of your song." },
  { task: "artwork", title: "Create artwork", copy: "Build a visual world around your music." },
  { task: "video", title: "Make a music video", copy: "Turn your track and visuals into a story." },
  { task: "writing", title: "Write with Buddy", copy: "Draft, refine and sharpen your words." },
];

export function BuddyWelcome({ onChoose }: { onChoose: (task: BuddyTask) => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-[radial-gradient(circle_at_top_right,oklch(0.58_0.24_26_/_0.2),transparent_45%),linear-gradient(145deg,oklch(0.18_0.05_20_/_0.92),oklch(0.10_0.025_20_/_0.96))] p-5 shadow-[0_20px_60px_oklch(0_0_0_/_0.35)] sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-primary">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="size-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.22em]">Buddy is ready</span>
        </div>
        <h1 className="mt-4 max-w-xl font-display text-3xl font-black leading-[1.05] tracking-tight text-glow sm:text-5xl">
          You make the creative decisions. Buddy handles the technical stuff.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Pick what you want to make. Buddy automatically chooses the best local or free/open route
          available for the job. You never need to choose a model or configure an AI provider.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TASKS.map(({ task, title, copy }) => {
            const plan = buddyPlan(task);
            return (
              <button
                key={task}
                type="button"
                onClick={() => onChoose(task)}
                className={cn(
                  "group rounded-2xl border border-border/70 bg-background/45 p-3 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.985]",
                  plan.mode === "unavailable" && "opacity-60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold">{title}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{copy}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-primary">
            Automatic routing
          </span>
          <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5">
            Free-first
          </span>
          <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5">
            Android ready
          </span>
          <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5">
            No model setup
          </span>
        </div>
      </div>
    </section>
  );
}
