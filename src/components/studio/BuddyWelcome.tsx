import { ArrowRight, Image, MessageCircle, Mic, Music2, Sparkles, Video } from "lucide-react";
import { buddyPlan, type BuddyTask } from "@/lib/buddy-orchestrator";
import { setBuddyStatus } from "@/lib/buddy-presence";
import { BuddyPresence } from "@/components/studio/BuddyPresence";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { cn } from "@/lib/utils";

const ASSET_HOST = "https://littleredsbigstudio.lovable.app";
const LOGO_URL = `${ASSET_HOST}/__l5e/assets-v1/16f5a992-d713-465f-92b1-1c25513454ff/littlered-logo.png`;
const BACKGROUND_URL = `${ASSET_HOST}/__l5e/assets-v1/0f86dd41-b96b-4c62-bf5b-f6f3b85f0556/red-moon-bg.png`;
const TASKS: { task: BuddyTask; title: string; copy: string; icon: typeof Music2 }[] = [
  {
    task: "music",
    title: "Generate Song",
    copy: "Create real music from your idea and lyrics.",
    icon: Music2,
  },
  {
    task: "writing",
    title: "Generate Lyrics",
    copy: "Write original lyrics with Buddy.",
    icon: Sparkles,
  },
  {
    task: "artwork",
    title: "Generate Image",
    copy: "Create artwork for your project.",
    icon: Image,
  },
  {
    task: "video",
    title: "Generate Video",
    copy: "Bring your image and audio to life.",
    icon: Video,
  },
  {
    task: "voice",
    title: "Voice Clone & Swap",
    copy: "Shape voices you own or have permission to use.",
    icon: Mic,
  },
  {
    task: "writing",
    title: "Live Buddy",
    copy: "Talk hands-free while you create.",
    icon: MessageCircle,
  },
];

export function BuddyWelcome({ onChoose }: { onChoose: (task: BuddyTask) => void }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/35 bg-black shadow-[0_30px_100px_oklch(0_0_0_/_0.48)]">
      <img
        src={BACKGROUND_URL}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,oklch(0.04_0.02_20_/_0.98)_5%,oklch(0.08_0.025_20_/_0.72)_55%,oklch(0.12_0.06_20_/_0.35)_100%)]" />
      <div className="paint-drip-field absolute inset-x-0 top-0 z-10 h-14" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative p-5 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="Little Red's Big Studio"
                className="brand-mark-animated h-12 w-auto rounded-xl border border-primary/25 bg-black/45 p-1.5 backdrop-blur-md"
              />
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                Little Red's Big Studio
              </span>
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[0.98] tracking-tight text-white drop-shadow-2xl sm:text-6xl">
              Make something brilliant.
              <span className="block text-primary text-glow">Buddy is here.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Create music, lyrics, artwork, video and vocals in one place. Buddy quietly handles
              the complicated bits and keeps your creative flow moving.
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
            <p className="mt-1 text-xs leading-5 text-white/55">Talk, create and keep moving.</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TASKS.map(({ task, title, copy, icon: Icon }) => {
            const plan = buddyPlan(task);
            return (
              <button
                key={title}
                type="button"
                onClick={() => {
                  setBuddyStatus(plan.mode === "unavailable" ? "error" : "thinking", {
                    task,
                    message:
                      plan.mode === "unavailable"
                        ? "That feature is temporarily unavailable. I won't pretend it worked."
                        : `Opening ${title}…`,
                  });
                  onChoose(task);
                }}
                className={cn(
                  "group rounded-2xl border border-white/10 bg-black/45 p-3.5 text-left shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.985]",
                  plan.mode === "unavailable" && "opacity-60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-display text-sm font-bold text-white">
                    <Icon className="size-4 text-primary" />
                    {title}
                  </span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-white/55">{copy}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-primary">
            Buddy chooses automatically
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65">
            Your assets
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-white/65">
            Free-first
          </span>
        </div>
      </div>
    </section>
  );
}
