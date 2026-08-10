import { useEffect, useState } from "react";
import {
  Compass,
  Film,
  Mic2,
  Music2,
  PenLine,
  SlidersHorizontal,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { BuddyLiveChat } from "@/components/studio/BuddyLiveChat";
import { Chip, StudioButton } from "@/components/studio/ui";
import { FreeCreatePanel } from "@/components/studio/FreeCreatePanel";
import { cn } from "@/lib/utils";
import {
  LabPanel,
  QRangePanel,
  StoryboardPanel,
  UploadPanel,
  VideoPanel,
} from "@/components/studio/sections-create";
import {
  AccessPanel,
  ProfilePanel,
  SeoPanel,
  SpotlightPanel,
  SupportPanel,
} from "@/components/studio/sections-community";

const TITLE = "Little Red's Big Studio";
const DESCRIPTION = "Little Red's Big Studio — make music, visuals, voices and stories with Buddy.";
const LOGO = "/little-reds-logo.svg";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:image", content: LOGO },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
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
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);
  const go = (next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      <AnimatedBackground />
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-2xl">
          <img
            src={LOGO}
            alt={TITLE}
            className="w-[min(34rem,82vw)] animate-moon drop-shadow-[0_0_40px_hsl(var(--primary)/0.45)]"
          />
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-primary/15">
            <div className="h-full w-1/2 animate-wave rounded-full bg-primary" />
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl justify-center px-4 py-3">
          <a href="./" aria-label={`${TITLE} home`}>
            <img
              src={LOGO}
              alt={`${TITLE} logo`}
              className="h-12 w-auto max-w-[88vw] object-contain drop-shadow-[0_0_24px_hsl(var(--primary)/0.32)] sm:h-14"
            />
          </a>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 sm:flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2.5 font-display text-xs font-semibold",
                  tab === t.id
                    ? "crimson-gloss text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="mx-auto mb-1 size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:pb-16 sm:pt-7">
        {tab === "home" && (
          <div className="space-y-7">
            <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-background/45 p-5 shadow-[0_25px_100px_oklch(0_0_0_/_0.35)] backdrop-blur-xl sm:p-8">
              <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.28em] text-primary">
                    Little Red's Big Studio
                  </p>
                  <h1 className="font-display text-4xl font-black tracking-tight sm:text-6xl">
                    Make something brilliant.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Your music, words, artwork, video and voice — all in one place. Buddy stays with
                    you and keeps the creative flow moving.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Chip>Your assets</Chip>
                    <Chip>Android ready</Chip>
                    <Chip>Buddy is here</Chip>
                  </div>
                </div>
                <div className="flex justify-center">
                  <BuddyAnimatedAssistant status="idle" />
                </div>
              </div>
            </section>
            <section className="rounded-[2rem] border border-primary/20 bg-background/50 p-4 shadow-xl backdrop-blur-xl sm:p-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <BuddyAnimatedAssistant status="idle" compact />
                <div className="flex-1">
                  <p className="font-display text-lg font-bold">Buddy is with you.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Talk, create, listen and keep moving without leaving the Studio.
                  </p>
                </div>
                <StudioButton
                  onClick={() =>
                    document.getElementById("buddy-live")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Talk to Buddy
                </StudioButton>
              </div>
            </section>
            <section>
              <div className="mb-4">
                <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-primary">
                  Create
                </p>
                <h2 className="font-display text-2xl font-bold">What are we making?</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Tool
                  icon={<Music2 />}
                  title="Generate Song"
                  body="Turn an idea and lyrics into real music."
                  onClick={() => go("create")}
                />
                <Tool
                  icon={<PenLine />}
                  title="Generate Lyrics"
                  body="Write original lyrics with Buddy."
                  onClick={() => go("create")}
                />
                <Tool
                  icon={<Sparkles />}
                  title="Generate Image"
                  body="Create artwork for your project."
                  onClick={() => go("create")}
                />
                <Tool
                  icon={<Video />}
                  title="Generate Video"
                  body="Bring your image and audio to life."
                  onClick={() => go("create")}
                />
                <Tool
                  icon={<Mic2 />}
                  title="Voice Clone & Swap"
                  body="Shape voices you own or have permission to use."
                  onClick={() => go("create")}
                />
                <Tool
                  icon={<Users />}
                  title="Live Buddy"
                  body="Talk hands-free while you create."
                  onClick={() =>
                    document.getElementById("buddy-live")?.scrollIntoView({ behavior: "smooth" })
                  }
                />
              </div>
            </section>
            <div id="buddy-live">
              <BuddyLiveChat />
            </div>
            <section className="rounded-[2rem] border border-border/50 bg-background/40 p-5 backdrop-blur-xl">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Your creative space
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Start anywhere. Buddy keeps the workflow moving.
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Mini title="Bring it in" body="Add your track, image or voice reference." />
                <Mini title="Make it yours" body="Write, create and shape your ideas." />
                <Mini
                  title="Bring it to life"
                  body="Turn music and visuals into something bigger."
                />
              </div>
            </section>
            <SupportPanel />
          </div>
        )}
        {tab === "create" && <FreeCreatePanel />}
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
        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Little Red's Big Studio <span className="mx-2">•</span> Make it real.
        </footer>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1",
                  tab === t.id ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="text-[0.6rem] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
function Tool({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border/60 bg-background/45 p-5 text-left backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary group-hover:scale-105">
        {icon}
      </span>
      <h3 className="font-display font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </button>
  );
}
function Mini({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
