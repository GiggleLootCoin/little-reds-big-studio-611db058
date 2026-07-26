import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/littlered-logo.png.asset.json";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { Chip } from "@/components/studio/ui";
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

const TITLE = "Little Red's Big Studio — Automated Music Video Production";
const DESCRIPTION =
  "A crimson-lit, mobile-first creative suite: AI song critique, stem separation, Red's QRange, the Council of 9, storyboarding and video generation.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

const VERSION = "Studio Version 3.6.9.12";

function Studio() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatedBackground />

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/85 backdrop-blur-md">
          <img src={logo.url} alt="Little Red's Big Studio" className="w-64 max-w-[80vw] animate-moon" />
          <div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
            <div className="gloss-sheen crimson-gloss h-full w-full" />
          </div>
          <p className="font-display text-xs tracking-[0.3em] text-primary">{VERSION}</p>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <img src={logo.url} alt="Little Red's Big Studio logo" className="mx-auto h-12 w-auto" />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
        <h1 className="text-center font-display text-2xl font-black leading-tight text-glow">
          Little Red's Big Studio
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Full-automation music video production — audio in, finished visuals out.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Chip>{VERSION}</Chip>
          <Chip>Preset to perfection</Chip>
          <Chip>Always adjustable</Chip>
        </div>

        <div className="drip-divider my-6" />

        <div className="space-y-3">
          <QRangePanel />
          <CoachPanel />
          <LabPanel />
          <CouncilPanel />
          <LyricsPanel />
          <UploadPanel />
          <ChatPanel />
          <StoryboardPanel />
          <VideoPanel />
          <SpotlightPanel />
          <ProfilePanel />
          <AccessPanel />
          <SeoPanel />
          <EnginePanel />
          <PluginPanel />
          <SupportPanel />
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Made with love ❤️ by LittleRedBigSmile 🔴😁✨️
        </footer>
      </main>
    </>
  );
}
