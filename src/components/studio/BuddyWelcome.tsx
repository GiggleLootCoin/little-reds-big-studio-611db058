import { ArrowRight, Sparkles } from "lucide-react";
import { buddyPlan, type BuddyTask } from "@/lib/buddy-orchestrator";
import { cn } from "@/lib/utils";
import studioHero from "../../../lobby-hero.jpg";
import luxuryBanner from "../../../img_luxury_banner_1784415120642.jpg";

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
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/35 bg-black shadow-[0_24px_80px_oklch(0_0_0_/_0.45)]">
      <img
        src={studioHero}
        alt="Little Red's Big Studio visual reference"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <img
        src={luxuryBanner}
        alt=""
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 w-full object-cover opacity-20 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,oklch(0.06_0.02_20_/_0.97),oklch(0.12_0.035_20_/_0.78)_55%,oklch(0.12_0.08_20_/_0.5))]" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative p-5 sm:p-8">
        <div className="flex items-center gap-2 text-primary">
          <span className="flex size-10 items-center justify-center rounded-xl bg-black/40 ring-1 ring-primary/40 backdrop-blur-md">
            <Sparkles className="size-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.22em]">Buddy is ready</span>
        </div>
        <h1 className="mt-4 max-w-2xl font-display text-3xl font-black leading-[1.02] tracking-tight text-glow sm:text-5xl">
          You make the creative decisions. Buddy handles the technical stuff.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75 sm:text-base">
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
                  "group rounded-2xl border border-white/10 bg-black/45 p-3 text-left shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.985]",
                  plan.mode === "unavailable" && "opacity-60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold">{title}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-foreground/60">{copy}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-foreground/65">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">
            Automatic routing
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
            Free-first
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
            Android ready
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
            No model setup
          </span>
        </div>
      </div>
    </section>
  );
}
