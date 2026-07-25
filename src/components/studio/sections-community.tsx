import { useState } from "react";
import {
  Coffee,
  Crown,
  Flame,
  Heart,
  Hexagon,
  MessageCircle,
  Sparkles,
  UserCircle2,
  Youtube,
} from "lucide-react";
import { Chip, Note, Panel, Readout, StudioButton, StudioSlider } from "./ui";

/* 12 — Artist Spotlight community feed */
const ARTISTS = [
  { name: "LittleRedBigSmile", track: "Crimson Lullaby", hearts: 412, fire: 189 },
  { name: "NovaGhost", track: "Static Bloom", hearts: 87, fire: 44 },
  { name: "Ember & Ivy", track: "Slow Burn Sunday", hearts: 233, fire: 96 },
];

export function SpotlightPanel() {
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [hearted, setHearted] = useState<Record<string, boolean>>({});

  return (
    <Panel eyebrow="Module 12" title="Artist Spotlight Feed" icon={<Sparkles className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Share finished work, spread site love and connect with other creators.
      </p>
      {ARTISTS.map((a) => {
        const isFollowing = !!following[a.name];
        const isHearted = !!hearted[a.name];
        return (
          <article key={a.name} className="space-y-3 rounded-2xl border border-border bg-background/50 p-3">
            <div className="flex items-center gap-3">
              <span className="crimson-gloss flex size-10 items-center justify-center rounded-full font-display text-sm text-primary-foreground">
                {a.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-sm">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.track}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFollowing((f) => ({ ...f, [a.name]: !isFollowing }))}
              aria-pressed={isFollowing}
              className={`w-full rounded-xl px-4 py-2.5 font-display text-sm font-semibold transition-all duration-300 ${
                isFollowing
                  ? "border border-transparent bg-love text-primary-foreground shadow-[0_0_22px_oklch(0.7_0.23_15/70%)]"
                  : "crimson-gloss text-primary-foreground"
              }`}
            >
              {isFollowing ? "Showing Love To This Artist 💖" : "Show This Artist Some Love"}
            </button>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setHearted((h) => ({ ...h, [a.name]: !isHearted }))}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <Heart className={`size-4 ${isHearted ? "fill-current text-love" : ""}`} />
                {a.hearts + (isHearted ? 1 : 0)}
              </button>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-4 text-ember" /> {a.fire}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-4" /> Comments
              </span>
            </div>
          </article>
        );
      })}
    </Panel>
  );
}

/* 13 — Custom profiles */
export function ProfilePanel() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  return (
    <Panel eyebrow="Module 13" title="Custom Creator Profile" icon={<UserCircle2 className="size-5" />}>
      <div className="relative h-24 overflow-hidden rounded-xl border border-border">
        <div className="crimson-gloss absolute inset-0 opacity-70" />
        <div className="gloss-sheen absolute inset-0" />
        <span className="absolute bottom-2 left-3 font-display text-xs text-primary-foreground">
          Banner
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground">
          <UserCircle2 className="size-7" />
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2">
          <StudioButton variant="ghost">Upload</StudioButton>
          <StudioButton variant="ghost">Generate</StudioButton>
        </div>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Display name"
        className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={3}
        placeholder="About you..."
        className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <StudioButton className="w-full">Save profile</StudioButton>
    </Panel>
  );
}

/* 14 — Monetization / elite access */
export function AccessPanel() {
  const [vip, setVip] = useState("");
  return (
    <Panel eyebrow="Module 14" title="Access & Elite Tiers" icon={<Crown className="size-5" />}>
      <div className="grid gap-2">
        {[
          { tier: "Free Creator", note: "Full studio, fair daily quantities, same quality." },
          { tier: "Elite Unlimited", note: "Unlimited renders and stems. Quantity scales, quality never drops." },
          { tier: "Founder — LittleRedBigSmile", note: "Permanent free unlimited access." },
        ].map((t) => (
          <div key={t.tier} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="font-display text-sm text-primary">{t.tier}</div>
            <div className="text-xs text-muted-foreground">{t.note}</div>
          </div>
        ))}
      </div>
      <div className="drip-divider my-1" />
      <h3 className="font-display text-sm">VIP override</h3>
      <div className="flex gap-2">
        <input
          value={vip}
          onChange={(e) => setVip(e.target.value)}
          placeholder="Grant unlimited pass to @handle"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <StudioButton>Grant</StudioButton>
      </div>
      <Note>Billing and pass persistence activate when the studio backend is enabled.</Note>
    </Panel>
  );
}

/* 15 — YouTube SEO */
export function SeoPanel() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("dark pop");
  const [out, setOut] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const build = () => {
    const t = title.trim() || "Untitled Track";
    const tags = [
      genre.replace(/\s+/g, ""),
      "musicvideo",
      "aimusicvideo",
      "LittleRedBigSmile",
      "LittleRedsBigStudio",
      "newmusic",
      "indieartist",
    ].map((x) => `#${x}`);
    setOut(
      `TITLE\n${t} — Official Music Video | LittleRedBigSmile\n\n` +
        `DESCRIPTION\n"${t}" is a ${genre} record written, produced and visualised in Little Red's Big Studio.\n` +
        `Listen loud, watch in 4K, and tell me what the visuals made you feel.\n\n` +
        `Support the creator:\nYouTube: https://youtube.com/@little-red-big-smile\n` +
        `CashApp: https://cash.app/$LittleRedBigSmile\nBuy Me a Coffee: https://buymeacoffee.com/littleredbigsmile\n\n` +
        `HASHTAGS\n${tags.join(" ")}`,
    );
    setCopied(false);
  };

  return (
    <Panel eyebrow="Module 15" title="YouTube SEO & Metadata" icon={<Youtube className="size-5" />}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Track title"
        className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder="Genre / mood"
        className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <StudioButton className="w-full" onClick={build}>
        Generate metadata
      </StudioButton>
      {out && (
        <>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            {out}
          </pre>
          <StudioButton
            variant="ghost"
            className="w-full"
            onClick={() => {
              void navigator.clipboard.writeText(out).then(() => setCopied(true));
            }}
          >
            {copied ? "Copied ✔" : "Copy all"}
          </StudioButton>
        </>
      )}
    </Panel>
  );
}

/* 16 — Core engine philosophy */
export function EnginePanel() {
  const [resonance, setResonance] = useState(432);
  return (
    <Panel eyebrow="Module 16" title="Core Engine & Philosophy" icon={<Hexagon className="size-5" />}>
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Design" value="Consciousness-first" />
        <Readout label="Mathematics" value="Base 12 harmonic" />
        <Readout label="Tuning" value={`${resonance} Hz`} />
        <Readout label="Sovereignty" value="Absolute · user-owned" />
      </div>
      <StudioSlider
        label="Resonance alignment"
        value={resonance}
        min={396}
        max={444}
        unit=" Hz"
        onChange={setResonance}
      />
      <div className="flex flex-wrap gap-2">
        <Chip>Zero telemetry by default</Chip>
        <Chip>Your masters stay yours</Chip>
      </div>
    </Panel>
  );
}

/* 17 — Support the creator */
const LINKS = [
  {
    label: "YouTube ❤️",
    href: "https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3",
    icon: Youtube,
  },
  { label: "CashApp 💚", href: "https://cash.app/$LittleRedBigSmile", icon: Heart },
  { label: "Buy Me a Coffee ☕ 💕", href: "https://buymeacoffee.com/littleredbigsmile", icon: Coffee },
];

export function SupportPanel() {
  return (
    <Panel
      eyebrow="Module 17"
      title="Support The Creator"
      icon={<Heart className="size-5" />}
      defaultOpen
    >
      <p className="text-sm leading-relaxed">
        Little Red's Big Studio Is A Handmade Product Made With Love ❤️ By LittleRedBigSmile 🔴😁✨️
      </p>
      <p className="font-display text-sm text-primary text-glow">
        Support The Creator And Her Music On YouTube!
      </p>
      <p className="text-sm text-muted-foreground">🦸‍♀️Support Links:</p>
      <div className="grid gap-2">
        {LINKS.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="crimson-gloss flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
          >
            <Icon className="size-4" />
            {label}
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        CashApp is US-based — internationally, use Buy Me a Coffee.
      </p>
      <div className="drip-divider my-1" />
      <p className="text-sm">🎙✨️Special Thank You Shout Outs For Supporters! ✊️😁👍💕</p>
    </Panel>
  );
}
