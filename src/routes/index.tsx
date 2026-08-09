import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Film, Mic2, Plug, SlidersHorizontal, Users } from "lucide-react";
import logo from "@/assets/littlered-logo.png.asset.json";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { Chip, openStudioPanel } from "@/components/studio/ui";
import { EngineStatusStrip, NextMoves } from "@/components/studio/Dashboard";
import { cn } from "@/lib/utils";
import {
  ChatPanel,
  CoachPanel,
  CouncilPanel,
  LabPanel,
  LyricsPanel,
  QRangePanel,
  StoryboardPanel,
  UploadPanel,
  VideoPanel,
} from "@/components/studio/sections-create";
import {
  AccessPanel,
  EnginePanel,
  ProfilePanel,
  SeoPanel,
  SpotlightPanel,
  PluginPanel,
} from "@/components/studio/sections-community";
import { SupportPanel } from "@/components/studio/sections-community";
import { AnalyticsPanel, ModerationPanel } from "@/components/studio/sections-admin";
import { GithubPanel } from "@/components/studio/sections-github";


const SITE_URL = "https://little-reds-big-studio.lovable.app";
const TITLE = "Little Red's Big Studio — AI Music Video Production Suite";
const DESCRIPTION =
  "Free AI music studio: honest song critique, stem separation, lyrics writing, storyboards and video generation. Works inside ChatGPT and Claude.";
const OG_IMAGE = `${SITE_URL}${logo.url}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "AI music video, AI song critique, stem separation, AI lyrics generator, storyboard generator, music production app",
      },
      { property: "og:site_name", content: "Little Red's Big Studio" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Little Red's Big Studio",
          url: SITE_URL,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          image: OG_IMAGE,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: { "@type": "Person", name: "LittleRedBigSmile", url: "https://youtube.com/@little-red-big-smile" },
        }),
      },
    ],
  }),
  component: Studio,
});


const VERSION = "Studio Version 3.6.9.12";

type TabId = "home" | "write" | "mix" | "video" | "community" | "engines";

const TABS: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "home", label: "Home", icon: Compass },
  { id: "write", label: "Write", icon: Mic2 },
  { id: "mix", label: "Mix", icon: SlidersHorizontal },
  { id: "video", label: "Video", icon: Film },
  { id: "community", label: "Artists", icon: Users },
  { id: "engines", label: "Engines", icon: Plug },
];

/** Which tab owns each panel, so dashboard shortcuts can cross tabs. */
const PANEL_TAB: Record<string, TabId> = {
  "audio-voice-file-uploads": "mix",
  "elite-lyrics-voice-cloning": "write",
  "honest-critiquer-ai-song-coach": "write",
  "automated-storyboarding": "video",
};

function Studio() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("home");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const jump = (panelId: string) => {
    const target = PANEL_TAB[panelId] ?? "write";
    setTab(target);
    setTimeout(() => openStudioPanel(panelId), 60);
  };

  const go = (next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <AnimatedBackground />

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/90 backdrop-blur-md">
          <img src={logo.url} alt="Little Red's Big Studio" className="w-64 max-w-[80vw] animate-moon" />
          <div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
            <div className="gloss-sheen crimson-gloss h-full w-full" />
          </div>
          <p className="font-display text-xs tracking-[0.3em] text-primary">{VERSION}</p>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <img src={logo.url} alt="Little Red's Big Studio logo" className="h-10 w-auto" />
          <Link
            to="/connect"
            className="shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Connect AI
          </Link>
        </div>
        {/* Desktop / wide tab rail */}
        <nav aria-label="Studio sections" className="mx-auto hidden w-full max-w-3xl gap-1 px-4 pb-2 sm:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => go(t.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 font-display text-xs font-semibold tracking-wide transition-colors",
                tab === t.id
                  ? "crimson-gloss text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:pb-16">
        {tab === "home" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-background/60 p-5 text-center backdrop-blur-md">
              <h1 className="font-display text-2xl font-black leading-tight text-glow sm:text-3xl">
                Little Red's Big Studio
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Audio in, finished music video out. Every control preset to radio-ready — and always adjustable.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Chip>{VERSION}</Chip>
                <Chip>Preset to perfection</Chip>
                <Chip>Always adjustable</Chip>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-foreground before:h-4 before:w-1 before:rounded-full before:bg-primary before:content-['']">
                Your next move
              </h2>
              <NextMoves onJump={jump} />
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-foreground before:h-4 before:w-1 before:rounded-full before:bg-primary before:content-['']">
                Engine status
              </h2>
              <EngineStatusStrip />
              <p className="text-xs text-muted-foreground">
                Engines marked “needs provider key” are registered but not switched on yet — open{" "}
                <button type="button" onClick={() => go("engines")} className="font-semibold text-primary underline">
                  Engines
                </button>{" "}
                to add a provider and go live.
              </p>
            </section>

            <div className="drip-divider" />
            <SupportPanel />
          </div>
        )}

        {tab === "write" && (
          <div className="space-y-3">
            <LyricsPanel />
            <CoachPanel />
            <CouncilPanel />
            <ChatPanel />
          </div>
        )}

        {tab === "mix" && (
          <div className="space-y-3">
            <UploadPanel />
            <QRangePanel />
            <LabPanel />
          </div>
        )}

        {tab === "video" && (
          <div className="space-y-3">
            <StoryboardPanel />
            <VideoPanel />
            <SeoPanel />
          </div>
        )}

        {tab === "community" && (
          <div className="space-y-3">
            <SpotlightPanel />
            <ProfilePanel />
            <AccessPanel />
          </div>
        )}

        {tab === "engines" && (
          <div className="space-y-3">
            <EngineStatusStrip />
            <PluginPanel />
            <EnginePanel />
            <ModerationPanel />
            <AnalyticsPanel />
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Made with love ❤️ by LittleRedBigSmile 🔴😁✨️
        </footer>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Studio sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <div className="grid grid-cols-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => go(t.id)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className={cn("size-5", active && "drop-shadow-[0_0_6px_currentColor]")} />
                <span className="text-[0.6rem] font-semibold tracking-wide">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );

}
