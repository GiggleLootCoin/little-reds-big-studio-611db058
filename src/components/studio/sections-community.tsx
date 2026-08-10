import { useEffect, useState } from "react";
import { Clock3, ExternalLink, Heart, Plug, UserCircle2, Users } from "lucide-react";
import { FREE_RUNNERS } from "@/lib/free-runners";
import { listPlugins } from "@/lib/plugins.functions";
import { useAuth, useProfile, ensureTrialStarted, trialKey, TRIAL_DURATION_MS } from "@/hooks/use-auth";
import { Panel, Note, Readout, StudioButton } from "./ui";
import { Field, TextArea } from "./AiOutput";
import { FreeRunnerPanel } from "./FreeRunnerPanel";
import type { PublicPlugin } from "@/lib/plugins.registry.server";

export function SpotlightPanel() {
  return (
    <Panel eyebrow="Module 12" title="Artist Spotlight — Local" icon={<Heart className="size-5" />}>
      <Note>Your creator feed is now local-first. Drafts stay on the device and finished work can be shared through your normal publishing platform.</Note>
    </Panel>
  );
}

export function ProfilePanel() {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile(user?.id);
  const [about, setAbout] = useState("");
  useEffect(() => setAbout(profile?.about || ""), [profile]);
  if (!profile) return <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}><Note>Loading local profile…</Note></Panel>;
  return (
    <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}>
      <Field label="Display name" value={profile.display_name} onChange={(e) => { const p = { ...profile, display_name: e.target.value }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }} />
      <TextArea label="About" value={about} onChange={(e) => setAbout(e.target.value)} />
      <StudioButton className="w-full" onClick={() => { const p = { ...profile, about }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }}>Save locally</StudioButton>
    </Panel>
  );
}

export function AccessPanel() {
  return (
    <Panel eyebrow="Privacy" title="Local-first access" icon={<Users className="size-5" />}>
      <Readout label="Account requirement">Optional local account</Readout>
      <Readout label="AI API keys">None</Readout>
      <Readout label="Colab requirement">None</Readout>
      <Note>Studio drafts, settings and creator profile stay in browser storage. Heavy AI uses public free runners when needed. Account-backed lifelong sync and verified memberships require the trusted deployment backend.</Note>
    </Panel>
  );
}

export function EnginePanel() {
  return (
    <Panel eyebrow="Execution" title="Free Execution Map" icon={<Plug className="size-5" />}>
      <FreeRunnerPanel />
      <div className="grid gap-2">{FREE_RUNNERS.map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3"><span className="text-sm">{r.name}</span><a href={r.url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="size-4" /></a></div>)}</div>
    </Panel>
  );
}

export function SeoPanel() {
  return <Panel eyebrow="Module 15" title="YouTube SEO Workspace" icon={<Plug className="size-5" />}><Note>SEO generation is prepared as a free/open-model job. Buddy should execute it directly whenever a healthy no-key route is available.</Note></Panel>;
}

function runnerUrlForPlugin(plugin: PublicPlugin) {
  if (plugin.slug === "ace-step-open") return FREE_RUNNERS.find((runner) => runner.id === "hf-ace-step")?.url;
  if (plugin.runtime === "kaggle") return FREE_RUNNERS.find((runner) => runner.id === "kaggle")?.url;
  if (plugin.runtime === "lightning") return FREE_RUNNERS.find((runner) => runner.id === "lightning")?.url;
  const preferred = { voice: "hf-rvc", stems: "hf-audio", video: "hf-video", music: "hf-music", image: "android-local", text: "android-local" }[plugin.capability];
  return FREE_RUNNERS.find((runner) => runner.id === preferred)?.url ?? plugin.projectUrl;
}

export function PluginPanel() {
  const [plugins, setPlugins] = useState<PublicPlugin[]>([]);
  useEffect(() => { listPlugins().then(setPlugins).catch(() => setPlugins([])); }, []);
  return (
    <Panel eyebrow="Open Models" title="No-API Model Catalog" icon={<Plug className="size-5" />}>
      <p className="text-sm text-muted-foreground">Only open models are listed. Commercial API providers and secret keys are intentionally absent. Buddy chooses the best available free execution route.</p>
      <div className="grid gap-2">{plugins.map((p) => { const runnerUrl = runnerUrlForPlugin(p); return <div key={p.slug} className="rounded-xl border border-border bg-background/40 p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-display text-sm">{p.name}</div><div className="text-xs text-muted-foreground">{p.capability} · {p.runtime}</div></div><span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{p.available ? "Ready" : "Free route"}</span></div>{runnerUrl && <a href={runnerUrl} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"><ExternalLink className="size-3.5" aria-hidden />Open free runner</a>}</div>; })}</div>
    </Panel>
  );
}

function TrialCountdown() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    const started = ensureTrialStarted(user.id);
    const tick = () => setRemaining(Math.max(0, started + TRIAL_DURATION_MS - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [user?.id]);
  if (!user || remaining === null) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const active = remaining > 0;
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/[.07] p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-red-200"><Clock3 className="size-4" /> {active ? "7-Day All-Access Trial" : "Trial Complete"}</div>
      {active ? <><div className="mt-2 font-display text-3xl font-black tabular-nums text-white">{days}d {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</div><p className="mt-1 text-xs text-white/55">Everything is unlocked during your trial. No watermark. Try it before you buy it.</p></> : <p className="mt-2 text-sm text-white/70">Your projects stay yours. Buddy Unlimited is $10/month for the full watermark-free experience.</p>}
    </div>
  );
}

export function SupportPanel() {
  return (
    <Panel eyebrow="Free by design" title="Studio Support" icon={<Plug className="size-5" />}>
      <TrialCountdown />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <a href="https://buymeacoffee.com/littleredbigsmile" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">☕💕 Buy Me a Coffee</a>
        <a href="https://cash.app/$LittleRedBigSmile" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">💚 Cash App</a>
        <a href="https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">🎙️✨ YouTube</a>
      </div>
      <Note>Buddy Unlimited is planned as the $10/month membership. Supporter shout-outs are opt-in and automated; private supporters remain private. Payment verification and cross-device entitlement must be enforced by the trusted deployment backend, not browser storage.</Note>
    </Panel>
  );
}
