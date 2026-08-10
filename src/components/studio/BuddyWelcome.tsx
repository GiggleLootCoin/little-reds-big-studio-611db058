import { ArrowRight, Sparkles } from "lucide-react";
import { buddyPlan, type BuddyTask } from "@/lib/buddy-orchestrator";
import { setBuddyStatus } from "@/lib/buddy-presence";
import { BuddyPresence } from "@/components/studio/BuddyPresence";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { cn } from "@/lib/utils";
import logo from "@/assets/littlered-logo.png.asset.json";
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
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/35 bg-black shadow-[0_30px_100px_oklch(0_0_0_/_0.48)]">
      <img
        src={studioHero}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <img
        src={luxuryBanner}
        alt=""
        aria-hidden="true"
        className="absolute -right-8 bottom-0 h-44 w-80 rotate-1 object-cover opacity-25 mix-blend-screen blur-[0.2px] sm:h-56 sm:w-[28rem]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,oklch(0.055_0.02_20_/_0.98)_5%,oklch(0.09_0.025_20_/_0.8)_52%,oklch(0.12_0.06_20_/_0.42)_100%)]" />
      <div className="paint-drip-field absolute inset-x-0 top-0 z-10 h-12" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative p-5 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-primary">
              <img
                src={logo.url}
                alt="Little Red's Big Studio"
                className="brand-mark-animated h-10 w-auto rounded-xl border border-primary/25 bg-black/45 p-1.5 backdrop-blur-md"
              />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">Buddy is ready</span>
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[0.98] tracking-tight text-white drop-shadow-2xl sm:text-6xl">
              Make something brilliant.
              <span className="block text-primary text-glow">Buddy handles the rest.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Bring your idea, track, voice or image. Buddy chooses the best available route for the
              job, keeps the technical machinery backstage, and leaves every creative decision in
              your hands.
            </p>
            <BuddyPresence className="mt-5 max-w-xl border-white/10 bg-black/35" />
          </div>

          <div className="hidden shrink-0 sm:block">
            <BuddyAnimatedAssistant status="idle" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 sm:hidden">
          <BuddyAnimatedAssistant status="idle" compact />
          <div>
            <p className="font-display text-sm font-bold text-white">Buddy is with you.</p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              Tell Buddy what you want to make. The technical stuff stays backstage.
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TASKS.map(({ task, title, copy }) => {
            const plan = buddyPlan(task);
            return (
              <button
                key={task}
                type="button"
                onClick={() => {
                  setBuddyStatus(plan.mode === "unavailable" ? "error" : "thinking", {
                    task,
                    message:
                      plan.mode === "unavailable"
                        ? "That route isn't configured yet. I won't pretend otherwise."
                        : null,
                  });
                  onChoose(task);
                }}
                className={cn(
                  "group rounded-2xl border border-white/10 bg-black/40 p-3.5 text-left shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_12px_35px_oklch(0.55_0.22_25_/_0.16)] active:scale-[0.985]",
                  plan.mode === "unavailable" && "opacity-60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-white">{title}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-white/55">{copy}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-primary backdrop-blur-md">
            Buddy chooses automatically
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">
            Free-first
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">
            Android ready
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">
            No model setup
          </span>
        </div>
      </div>
    </section>
  );
}
