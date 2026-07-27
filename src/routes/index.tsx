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
import { AnalyticsPanel, ModerationPanel } from "@/components/studio/sections-admin";

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
        <div className="mt-4 text-center">
          <Link
            to="/connect"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Use this studio inside ChatGPT &amp; Claude →
          </Link>
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
          <ModerationPanel />
          <AnalyticsPanel />
          <SupportPanel />
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Made with love ❤️ by LittleRedBigSmile 🔴😁✨️
        </footer>
      </main>
    </>
  );
}
