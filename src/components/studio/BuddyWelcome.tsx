import { ArrowRight, Image, MessageCircle, Mic, Music2, Sparkles, Video } from "lucide-react";
import { buddyPlan, type BuddyTask } from "@/lib/buddy-orchestrator";
import { setBuddyStatus } from "@/lib/buddy-presence";
import { BuddyPresence } from "@/components/studio/BuddyPresence";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { cn } from "@/lib/utils";
import logo from "@/assets/littlered-logo.png.asset.json";
import studioBackground from "@/assets/red-moon-bg.png.asset.json";

const TASKS: { task: BuddyTask; title: string; copy: string; icon: typeof Music2 }[] = [
  { task: "music", title: "Generate Song", copy: "Create real music from your idea and lyrics.", icon: Music2 },
  { task: "writing", title: "Generate Lyrics", copy: "Write original lyrics locally in your browser.", icon: Sparkles },
  { task: "artwork", title: "Generate Image", copy: "Create artwork with the free image engine.", icon: Image },
  { task: "video", title: "Generate Video", copy: "Turn your image and audio into motion.", icon: Video },
  { task: "voice", title: "Voice Tools", copy: "Clone or swap voices you have permission to use.", icon: Mic },
  { task: "writing", title: "Talk to Buddy", copy: "Open Live Voice and chat hands-free.", icon: MessageCircle },
];

export function BuddyWelcome({ onChoose }: { onChoose: (task: BuddyTask) => void }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/35 bg-black shadow-[0_30px_100px_oklch(0_0_0_/_0.48)]">
      <img src={studioBackground.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,oklch(0.045_0.02_20_/_0.98)_5%,oklch(0.08_0.025_20_/_0.78)_55%,oklch(0.12_0.06_20_/_0.38)_100%)]" />
      <div className="paint-drip-field absolute inset-x-0 top-0 z-10 h-12" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative p-5 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 text-primary">
              <img src={logo.url} alt="Little Red's Big Studio" className="brand-mark-animated h-12 w-auto rounded-xl border border-primary/25 bg-black/45 p-1.5 backdrop-blur-md" />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">Your Studio • Buddy is here</span>
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[0.98] tracking-tight text-white drop-shadow-2xl sm:text-6xl">
              Little Red's Big Studio.
              <span className="block text-primary text-glow">Make it real.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Your music, your images, your logo and your Buddy stay at the heart of the Studio. Pick a job below or talk to Buddy live. Heavy generation runs through free/open engines and only counts as complete when an actual result comes back.
            </p>
            <BuddyPresence className="mt-5 max-w-xl border-white/10 bg-black/35" />
          </div>
          <div className="hidden shrink-0 sm:block"><BuddyAnimatedAssistant status="idle" /></div>
        </div>
        <div className="mt-6 flex items-center gap-3 sm:hidden">
          <BuddyAnimatedAssistant status="idle" compact />
          <div>
            <p className="font-display text-sm font-bold text-white">Buddy is your animated AI assistant.</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Talk, create, listen and keep moving without leaving the Studio.</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TASKS.map(({ task, title, copy, icon: Icon }) => {
            const plan = buddyPlan(task);
            return (
              <button
                key={`${task}-${title}`}
                type="button"
                onClick={() => {
                  setBuddyStatus(plan.mode === "unavailable" ? "error" : "thinking", {
                    task,
                    message: plan.mode === "unavailable" ? "That route is unavailable right now. I won't pretend it ran." : `Opening ${title}…`,
                  });
                  onChoose(task);
                }}
                className={cn("group rounded-2xl border border-white/10 bg-black/45 p-3.5 text-left shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.985]", plan.mode === "unavailable" && "opacity-60")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-display text-sm font-bold text-white"><Icon className="size-4 text-primary" />{title}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-white/55">{copy}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-primary backdrop-blur-md">Real outputs only</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">Your assets</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">Free-first</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65 backdrop-blur-md">Android ready</span>
        </div>
      </div>
    </section>
  );
}
