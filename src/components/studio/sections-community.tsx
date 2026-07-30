import { useCallback, useEffect, useState } from "react";
import {
  Coffee,
  Crown,
  Flame,
  Heart,
  Hexagon,
  MessageCircle,
  Plug,
  Sparkles,
  UserCircle2,
  Youtube,
} from "lucide-react";
import { Chip, Note, Panel, Readout, StudioButton, StudioSlider } from "./ui";
import { AiOutput, ErrorNote, Field, SignInPrompt, Spinner, TextArea, useAsyncAction } from "./AiOutput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { dataUrlToFile, signedUrl, uploadToStudio } from "@/lib/media";
import { generateArtwork, generateSeo } from "@/lib/studio.functions";
import { listPlugins, refreshPluginScores, togglePlugin } from "@/lib/plugins.functions";
import { grantVip } from "@/lib/community.functions";
import { useStudio } from "@/lib/studio-store";

/* 12 — Artist Spotlight community feed */
type FeedTrack = {
  id: string;
  title: string;
  description: string;
  user_id: string;
  audio_url: string | null;
  cover_url: string | null;
  artist: string;
  handle: string;
  hearts: number;
  fire: number;
  hearted: boolean;
  fired: boolean;
  following: boolean;
  playable: string | null;
  comments: Array<{ id: string; body: string; user_id: string }>;
};

export function SpotlightPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [feed, setFeed] = useState<FeedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: tracks, error: e1 } = await supabase
        .from("tracks")
        .select("id, title, description, user_id, audio_url, cover_url, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (e1) throw new Error(e1.message);
      const rows = tracks ?? [];
      const ids = rows.map((t) => t.id);
      const artistIds = [...new Set(rows.map((t) => t.user_id))];

      const [profiles, reactions, comments, follows] = await Promise.all([
        artistIds.length
          ? supabase.from("profiles").select("id, display_name, handle").in("id", artistIds)
          : Promise.resolve({ data: [] as Array<{ id: string; display_name: string; handle: string }> }),
        ids.length
          ? supabase.from("reactions").select("track_id, kind, user_id").in("track_id", ids)
          : Promise.resolve({ data: [] as Array<{ track_id: string; kind: string; user_id: string }> }),
        ids.length
          ? supabase.from("comments").select("id, track_id, body, user_id").in("track_id", ids)
          : Promise.resolve({ data: [] as Array<{ id: string; track_id: string; body: string; user_id: string }> }),
        user
          ? supabase.from("follows").select("artist_id").eq("follower_id", user.id)
          : Promise.resolve({ data: [] as Array<{ artist_id: string }> }),
      ]);

      const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
      const followSet = new Set((follows.data ?? []).map((f) => f.artist_id));

      const built = await Promise.all(
        rows.map(async (t) => {
          const rx = (reactions.data ?? []).filter((r) => r.track_id === t.id);
          const p = profileMap.get(t.user_id);
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            user_id: t.user_id,
            audio_url: t.audio_url,
            cover_url: t.cover_url,
            artist: p?.display_name ?? "Creator",
            handle: p?.handle ?? "creator",
            hearts: rx.filter((r) => r.kind === "heart").length,
            fire: rx.filter((r) => r.kind === "fire").length,
            hearted: !!user && rx.some((r) => r.kind === "heart" && r.user_id === user.id),
            fired: !!user && rx.some((r) => r.kind === "fire" && r.user_id === user.id),
            following: followSet.has(t.user_id),
            playable: await signedUrl(t.audio_url),
            comments: (comments.data ?? [])
              .filter((c) => c.track_id === t.id)
              .map((c) => ({ id: c.id, body: c.body, user_id: c.user_id })),
          } satisfies FeedTrack;
        }),
      );
      setFeed(built);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async (t: FeedTrack) => {
    if (!user) return;
    setFeed((f) => f.map((x) => (x.user_id === t.user_id ? { ...x, following: !t.following } : x)));
    if (t.following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("artist_id", t.user_id);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, artist_id: t.user_id });
    }
  };

  const toggleReaction = async (t: FeedTrack, kind: "heart" | "fire") => {
    if (!user) return;
    const on = kind === "heart" ? t.hearted : t.fired;
    setFeed((f) =>
      f.map((x) =>
        x.id === t.id
          ? kind === "heart"
            ? { ...x, hearted: !on, hearts: x.hearts + (on ? -1 : 1) }
            : { ...x, fired: !on, fire: x.fire + (on ? -1 : 1) }
          : x,
      ),
    );
    if (on) {
      await supabase
        .from("reactions")
        .delete()
        .eq("track_id", t.id)
        .eq("user_id", user.id)
        .eq("kind", kind);
    } else {
      await supabase.from("reactions").insert({ track_id: t.id, user_id: user.id, kind });
    }
  };

  const addComment = async (t: FeedTrack) => {
    if (!user || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    const { data, error: e } = await supabase
      .from("comments")
      .insert({ track_id: t.id, user_id: user.id, body })
      .select("id, body, user_id")
      .single();
    if (e) return setError(e.message);
    setFeed((f) => f.map((x) => (x.id === t.id ? { ...x, comments: [...x.comments, data] } : x)));
  };

  const publish = async () => {
    if (!user) return;
    setPublishing(true);
    setError(null);
    try {
      const { error: e } = await supabase.from("tracks").insert({
        user_id: user.id,
        title: studio.title || studio.audioName || "Untitled Track",
        description: studio.direction.slice(0, 400),
        audio_url: studio.audioPath,
      });
      if (e) throw new Error(e.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Panel eyebrow="Module 12" title="Artist Spotlight Feed" icon={<Sparkles className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Share finished work, spread site love and connect with other creators.
      </p>
      {!user && <SignInPrompt />}
      {user && (
        <StudioButton className="w-full" disabled={publishing} onClick={() => void publish()}>
          {publishing ? "Publishing…" : "Publish my session track to the feed"}
        </StudioButton>
      )}
      {loading && <Spinner label="Loading the spotlight feed…" />}
      {error && <ErrorNote message={error} />}
      {!loading && feed.length === 0 && <Note>No tracks yet — be the first to publish one.</Note>}

      {feed.map((a) => (
        <article key={a.id} className="space-y-3 rounded-2xl border border-border bg-background/50 p-3">
          <div className="flex items-center gap-3">
            <span className="crimson-gloss flex size-10 items-center justify-center rounded-full font-display text-sm text-primary-foreground">
              {a.artist.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-sm">{a.artist}</div>
              <div className="truncate text-xs text-muted-foreground">{a.title}</div>
            </div>
          </div>
          {a.playable && <audio controls src={a.playable} className="w-full" />}
          {a.user_id !== user?.id && (
            <button
              type="button"
              onClick={() => void toggleFollow(a)}
              aria-pressed={a.following}
              disabled={!user}
              className={`w-full rounded-xl px-4 py-2.5 font-display text-sm font-semibold transition-all duration-300 ${
                a.following
                  ? "border border-transparent bg-love text-primary-foreground shadow-[0_0_22px_oklch(0.7_0.23_15/70%)]"
                  : "crimson-gloss text-primary-foreground"
              }`}
            >
              {a.following ? "Showing Love To This Artist 💖" : "Show This Artist Some Love"}
            </button>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              type="button"
              disabled={!user}
              onClick={() => void toggleReaction(a, "heart")}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Heart className={`size-4 ${a.hearted ? "fill-current text-love" : ""}`} />
              {a.hearts}
            </button>
            <button
              type="button"
              disabled={!user}
              onClick={() => void toggleReaction(a, "fire")}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Flame className={`size-4 ${a.fired ? "fill-current text-ember" : "text-ember"}`} /> {a.fire}
            </button>
            <button
              type="button"
              onClick={() => setOpenComments(openComments === a.id ? null : a.id)}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <MessageCircle className="size-4" /> {a.comments.length}
            </button>
          </div>
          {openComments === a.id && (
            <div className="space-y-2">
              {a.comments.map((c) => (
                <p key={c.id} className="rounded-lg bg-background/60 px-3 py-2 text-xs">
                  {c.body}
                </p>
              ))}
              {user && (
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Leave some love..."
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <StudioButton onClick={() => void addComment(a)}>Post</StudioButton>
                </div>
              )}
            </div>
          )}
        </article>
      ))}
    </Panel>
  );
}

/* 13 — Custom profiles */
export function ProfilePanel() {
  const { user } = useAuth();
  const { profile, reload } = useProfile(user?.id);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [about, setAbout] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [bannerPath, setBannerPath] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const save = useAsyncAction<null>();
  const art = useAsyncAction<null>();

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name);
    setHandle(profile.handle);
    setAbout(profile.about);
    setAvatarPath(profile.avatar_url);
    setBannerPath(profile.banner_url);
    void signedUrl(profile.avatar_url).then(setAvatar);
    void signedUrl(profile.banner_url).then(setBanner);
  }, [profile]);

  const upload = async (file: File | undefined, kind: "avatar" | "banner") => {
    if (!file || !user) return;
    const path = await uploadToStudio(user.id, kind, file);
    const url = await signedUrl(path);
    if (kind === "avatar") {
      setAvatarPath(path);
      setAvatar(url);
    } else {
      setBannerPath(path);
      setBanner(url);
    }
  };

  const generate = (kind: "avatar" | "banner") =>
    void art.run(async () => {
      if (!user) throw new Error("Sign in first.");
      const r = await generateArtwork({
        data: { prompt: prompt || "A crimson-lit music creator portrait", kind },
      });
      const file = await dataUrlToFile(r.url, `${kind}.png`);
      await upload(file, kind);
      return null;
    });

  return (
    <Panel eyebrow="Module 13" title="Custom Creator Profile" icon={<UserCircle2 className="size-5" />}>
      {!user && <SignInPrompt />}
      <div className="relative h-24 overflow-hidden rounded-xl border border-border">
        {banner ? (
          <img src={banner} alt="Profile banner" className="size-full object-cover" />
        ) : (
          <>
            <div className="crimson-gloss absolute inset-0 opacity-70" />
            <div className="gloss-sheen absolute inset-0" />
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-center font-display text-sm">
          Upload banner
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void upload(e.target.files?.[0], "banner")}
          />
        </label>
        <StudioButton variant="ghost" disabled={!user || art.loading} onClick={() => generate("banner")}>
          Generate banner
        </StudioButton>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-border bg-background/60 text-muted-foreground">
          {avatar ? (
            <img src={avatar} alt="Profile avatar" className="size-full object-cover" />
          ) : (
            <UserCircle2 className="size-7" />
          )}
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2">
          <label className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-center font-display text-sm">
            Upload
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void upload(e.target.files?.[0], "avatar")}
            />
          </label>
          <StudioButton variant="ghost" disabled={!user || art.loading} onClick={() => generate("avatar")}>
            Generate
          </StudioButton>
        </div>
      </div>
      <Field
        label="AI artwork prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Hooded figure, glowing red moon, headphones..."
      />
      {art.loading && <Spinner label="Painting your artwork…" />}
      {art.error && <ErrorNote message={art.error} />}
      <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
      <TextArea label="About" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
      {save.error && <ErrorNote message={save.error} />}
      {status && <Note>{status}</Note>}
      <StudioButton
        className="w-full"
        disabled={!user || save.loading}
        onClick={() =>
          void save.run(async () => {
            if (!user) throw new Error("Sign in first.");
            const { error } = await supabase.from("profiles").upsert({
              id: user.id,
              display_name: name,
              handle: handle.replace(/^@/, ""),
              about,
              avatar_url: avatarPath,
              banner_url: bannerPath,
            });
            if (error) throw new Error(error.message);
            await reload();
            setStatus("Profile saved ✔");
            return null;
          })
        }
      >
        {save.loading ? "Saving…" : "Save profile"}
      </StudioButton>
    </Panel>
  );
}

/* 14 — Monetization / elite access */
export function AccessPanel() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [vip, setVip] = useState("");
  const action = useAsyncAction<string>();

  useEffect(() => {
    if (!user) return setRoles([]);
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => setRoles((data ?? []).map((r) => String(r.role))));
  }, [user]);

  const tier = roles.includes("admin")
    ? "Founder — permanent free unlimited access"
    : roles.includes("vip")
      ? "Elite Unlimited (VIP pass)"
      : "Free Creator";

  return (
    <Panel eyebrow="Module 14" title="Access & Elite Tiers" icon={<Crown className="size-5" />}>
      <Readout label="Your tier" value={user ? tier : "Signed out"} />
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
      {roles.includes("admin") ? (
        <>
          <div className="flex gap-2">
            <input
              value={vip}
              onChange={(e) => setVip(e.target.value)}
              placeholder="Grant unlimited pass to @handle"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <StudioButton
              disabled={action.loading || !vip.trim()}
              onClick={() =>
                void action.run(async () => {
                  const r = await grantVip({ data: { handle: vip, grant: true } });
                  setVip("");
                  return `${r.display_name} now has an unlimited VIP pass.`;
                })
              }
            >
              Grant
            </StudioButton>
          </div>
          {action.error && <ErrorNote message={action.error} />}
          {action.result && <Note>{action.result}</Note>}
        </>
      ) : (
        <Note>Only the founder account can grant VIP passes.</Note>
      )}
    </Panel>
  );
}

/* 15 — YouTube SEO */
export function SeoPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("LittleRedBigSmile");
  const [genre, setGenre] = useState("dark pop");
  const [vibe, setVibe] = useState("crimson, cinematic, emotional");
  const { loading, error, result, run } = useAsyncAction<string>();

  return (
    <Panel eyebrow="Module 15" title="YouTube SEO & Metadata" icon={<Youtube className="size-5" />}>
      <Field
        label="Track title"
        value={title || studio.title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Crimson Lullaby"
      />
      <Field label="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
      <Field label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
      <Field label="Vibe" value={vibe} onChange={(e) => setVibe(e.target.value)} />
      {!user && <SignInPrompt />}
      <StudioButton
        className="w-full"
        disabled={!user || loading}
        onClick={() =>
          void run(async () => {
            const t = (title || studio.title).trim();
            if (!t) throw new Error("Add a track title first.");
            const r = await generateSeo({ data: { title: t, artist, genre, vibe } });
            return r.seo;
          })
        }
      >
        {loading ? "Optimising…" : "Generate metadata"}
      </StudioButton>
      {loading && <Spinner label="Writing titles, description, tags and hashtags…" />}
      {error && <ErrorNote message={error} />}
      {result && <AiOutput text={result} label="Copy metadata" />}
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

/* 18 — Model plugin registry */
type PluginStatusRow = {
  slug: string;
  name: string;
  capability: string;
  quality: number;
  speed: number;
  enabled: boolean;
  available: boolean;
  reason: string;
};

export function PluginPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PluginStatusRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = (await listPlugins()) as unknown as PluginStatusRow[];
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Panel eyebrow="Module 18" title="Model Plugin Registry" icon={<Plug className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        The studio automatically routes each job to whichever free model is scoring best this week —
        Wan, Hunyuan Video, LTX Video, CogVideoX, OpenVoice, Fish Speech, Demucs, and any future model
        you register.
      </p>
      {busy && <Spinner label="Reading the plugin registry…" />}
      {error && <ErrorNote message={error} />}
      {rows.map((p) => (
        <div key={p.slug} className="rounded-xl border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-display text-sm text-primary">{p.name}</div>
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                {p.capability} · {p.provider} · score {Math.round(p.weekly_score)}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] ${
                p.available
                  ? "bg-primary/20 text-primary"
                  : "border border-border bg-secondary/50 text-muted-foreground"
              }`}
            >
              {p.available ? "Ready" : "Needs key"}
            </span>
          </div>
          {!p.available && <p className="mt-2 text-xs text-muted-foreground">{p.reason}</p>}
          {user && (
            <StudioButton
              variant="ghost"
              className="mt-2 w-full"
              onClick={() =>
                void togglePlugin({ data: { slug: p.slug, enabled: !p.enabled } }).then(load)
              }
            >
              {p.enabled ? "Disable" : "Enable"}
            </StudioButton>
          )}
        </div>
      ))}
      {user && (
        <StudioButton
          className="w-full"
          onClick={() =>
            void refreshPluginScores()
              .then((d) => setRows(d as unknown as PluginStatusRow[]))
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
          }
        >
          Recompute this week's winners
        </StudioButton>
      )}
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
