import { useEffect, useState } from "react";
import { Compass, Film, Mic2, Music2, PenLine, SlidersHorizontal, Sparkles, Users, Video, ArrowRight, Play, WandSparkles } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { BuddyLiveChat } from "@/components/studio/BuddyLiveChat";
import { StudioButton } from "@/components/studio/ui";
import { FreeCreatePanel } from "@/components/studio/FreeCreatePanel";
import { cn } from "@/lib/utils";
import { LabPanel, QRangePanel, StoryboardPanel, UploadPanel, VideoPanel } from "@/components/studio/sections-create";
import { AccessPanel, ProfilePanel, SeoPanel, SpotlightPanel, SupportPanel } from "@/components/studio/sections-community";

const TITLE = "Little Red's Big Studio";
const DESCRIPTION = "Little Red's Big Studio — create music, visuals, voices and stories with Buddy.";
const LOGO = "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: TITLE }, { name: "description", content: DESCRIPTION }, { property: "og:image", content: LOGO }], links: [{ rel: "canonical", href: "/" }] }),
  component: Studio,
});

type TabId = "home" | "create" | "mix" | "video" | "community";
const TABS = [
  { id: "home" as TabId, label: "Home", icon: Compass },
  { id: "create" as TabId, label: "Create", icon: Sparkles },
  { id: "mix" as TabId, label: "Mix", icon: SlidersHorizontal },
  { id: "video" as TabId, label: "Video", icon: Film },
  { id: "community" as TabId, label: "Artists", icon: Users },
];

function Studio() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("home");
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 1100); return () => clearTimeout(timer); }, []);
  const go = (next: TabId) => { setTab(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      <AnimatedBackground />
      {loading && (
        <div className="studio-splash fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070308] px-6">
          <div className="splash-glow" />
          <img src={LOGO} alt={TITLE} className="relative z-10 w-[min(38rem,88vw)] animate-logo-breathe object-contain drop-shadow-[0_0_60px_rgba(235,35,70,.42)]" />
          <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.35em] text-white/55"><span className="size-1.5 animate-pulse rounded-full bg-red-500" /> Buddy is getting the Studio ready <span className="size-1.5 animate-pulse rounded-full bg-red-500" /></div>
        </div>
      )}

      <header className="studio-header sticky top-0 z-40 border-b border-white/10 bg-[#09050b]/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <a href="./" aria-label={`${TITLE} home`} className="shrink-0"><img src={LOGO} alt={`${TITLE} logo`} className="h-10 w-auto max-w-[58vw] object-contain sm:h-12" /></a>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-white/55 md:flex"><span className="size-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.9)]" /> Buddy online</div>
          <StudioButton className="hidden sm:inline-flex" onClick={() => go("create")}><WandSparkles className="size-4" /> Create</StudioButton>
        </div>
        <nav className="mx-auto hidden max-w-7xl gap-1 px-4 pb-2 sm:flex sm:px-6">{TABS.map((t) => { const Icon = t.icon; return <button key={t.id} onClick={() => go(t.id)} className={cn("flex-1 rounded-xl px-3 py-2.5 font-display text-xs font-semibold transition-all", tab === t.id ? "crimson-gloss text-primary-foreground shadow-[0_0_25px_rgba(220,38,38,.22)]" : "text-white/50 hover:bg-white/[.06] hover:text-white")}><Icon className="mx-auto mb-1 size-4" />{t.label}</button>; })}</nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pb-16 sm:pt-8">
        {tab === "home" && <div className="space-y-6">
          <section className="hero-studio relative min-h-[34rem] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/30 shadow-[0_35px_120px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
            <div className="relative grid min-h-[34rem] items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:p-14">
              <div className="z-10 max-w-2xl lg:pb-10">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.28em] text-red-200"><span className="size-1.5 animate-pulse rounded-full bg-red-400" /> Your creative space</div>
                <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)] font-black leading-[.88] tracking-[-.06em] text-white">Make it<br/><span className="bg-gradient-to-r from-white via-red-200 to-red-500 bg-clip-text text-transparent">real.</span></h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">Music, lyrics, artwork, video and vocals—one creative flow. Buddy stays beside you, handles the complicated bits and tells you when something is genuinely ready.</p>
                <div className="mt-7 flex flex-wrap gap-3"><StudioButton className="h-12 rounded-2xl px-6 text-sm" onClick={() => go("create")}><Sparkles className="size-4" /> Create with Buddy <ArrowRight className="size-4" /></StudioButton><button onClick={() => document.getElementById("buddy-live")?.scrollIntoView({ behavior: "smooth" })} className="flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[.05] px-5 text-sm font-bold text-white transition hover:bg-white/[.1]"><Play className="size-4 fill-current" /> Talk to Buddy</button></div>
              </div>
              <div className="relative z-10 flex min-h-[19rem] items-center justify-center lg:min-h-[30rem]"><BuddyAnimatedAssistant status="idle" className="buddy-hero-scale" /></div>
            </div>
            <div className="absolute inset-x-8 bottom-5 hidden h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent sm:block" />
            <div className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[9px] font-bold uppercase tracking-[.3em] text-white/30 sm:block">Create • Listen • Make • Repeat</div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Tool icon={<Music2 />} title="Generate Song" body="Turn an idea into real music." onClick={() => go("create")} />
            <Tool icon={<PenLine />} title="Generate Lyrics" body="Give your song words that sound like you." onClick={() => go("create")} />
            <Tool icon={<Sparkles />} title="Generate Image" body="Build artwork for your release." onClick={() => go("create")} />
            <Tool icon={<Video />} title="Generate Video" body="Bring music and visuals together." onClick={() => go("create")} />
            <Tool icon={<Mic2 />} title="Voice Clone & Swap" body="Work with voices you own or have permission to use." onClick={() => go("create")} />
            <Tool icon={<Users />} title="Live Buddy" body="Talk hands-free while you create." onClick={() => document.getElementById("buddy-live")?.scrollIntoView({ behavior: "smooth" })} />
          </section>

          <section id="buddy-live" className="live-buddy-shell relative overflow-hidden rounded-[2.25rem] border border-red-400/15 bg-black/35 p-5 shadow-[0_25px_90px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-8">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-red-600/10 blur-3xl" />
            <div className="relative mb-5 flex items-end justify-between gap-4"><div><p className="font-display text-xs font-black uppercase tracking-[.25em] text-red-300">Live with Buddy</p><h2 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">Your hands-free creative partner.</h2></div><div className="hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-white/45 sm:block">Voice + chat</div></div>
            <BuddyLiveChat />
          </section>

          <section className="grid gap-3 sm:grid-cols-3"><Mini title="Bring your idea" body="Start with a thought, lyric, melody, image or voice." /><Mini title="Let Buddy build" body="Create, refine and move between the Studio's tools." /><Mini title="Keep the result" body="Only completed media gets marked ready." /></section>
          <SupportPanel />
        </div>}
        {tab === "create" && <FreeCreatePanel />}
        {tab === "mix" && <div className="space-y-3"><UploadPanel /><QRangePanel /><LabPanel /></div>}
        {tab === "video" && <div className="space-y-3"><StoryboardPanel /><VideoPanel /><SeoPanel /></div>}
        {tab === "community" && <div className="space-y-3"><SpotlightPanel /><ProfilePanel /><AccessPanel /></div>}
        <footer className="mt-10 text-center text-xs text-white/35">Little Red's Big Studio <span className="mx-2">•</span> Make it real.</footer>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#09050b]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden"><div className="grid grid-cols-5">{TABS.map((t) => { const Icon = t.icon; return <button key={t.id} onClick={() => go(t.id)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 transition", tab === t.id ? "text-red-300" : "text-white/40")}><Icon className="size-5" /><span className="text-[.6rem] font-semibold">{t.label}</span></button>; })}</div></nav>
    </>
  );
}
function Tool({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) { return <button onClick={onClick} className="tool-card group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-400/35 hover:bg-red-500/[.05]"><span className="tool-icon mb-5 flex size-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 transition group-hover:scale-110 group-hover:rotate-3">{icon}</span><h3 className="font-display text-base font-black text-white">{title}</h3><p className="mt-1.5 text-xs leading-5 text-white/45">{body}</p><ArrowRight className="absolute right-5 top-5 size-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-red-300" /></button>; }
function Mini({ title, body }: { title: string; body: string }) { return <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 backdrop-blur-lg"><div className="mb-3 size-2 rounded-full bg-red-400 shadow-[0_0_14px_rgba(248,113,113,.8)]" /><h3 className="font-display text-sm font-black text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-white/45">{body}</p></div>; }
