import { useEffect, useState } from "react";
import { Clock3, Heart, Plug, UserCircle2, Users } from "lucide-react";
import { listPlugins } from "@/lib/plugins.functions";
import { useAuth, useProfile, ensureTrialStarted, TRIAL_DURATION_MS } from "@/hooks/use-auth";
import { Panel, Note, Readout, StudioButton } from "./ui";
import { Field, TextArea } from "./AiOutput";
import type { PublicPlugin } from "@/lib/plugins.registry.server";

export function SpotlightPanel() {
  return <Panel eyebrow="Module 12" title="Artist Spotlight — Local" icon={<Heart className="size-5" />}><Note>Your creator feed is now local-first. Drafts stay on the device and finished work can be shared through your normal publishing platform.</Note></Panel>;
}
export function ProfilePanel() {
  const { user } = useAuth(); const { profile, setProfile } = useProfile(user?.id); const [about, setAbout] = useState("");
  useEffect(() => setAbout(profile?.about || ""), [profile]);
  if (!profile) return <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}><Note>Loading local profile…</Note></Panel>;
  return <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}><Field label="Display name" value={profile.display_name} onChange={(e) => { const p = { ...profile, display_name: e.target.value }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }} /><TextArea label="About" value={about} onChange={(e) => setAbout(e.target.value)} /><StudioButton className="w-full" onClick={() => { const p = { ...profile, about }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }}>Save locally</StudioButton></Panel>;
}
export function AccessPanel() {
  return <Panel eyebrow="Privacy" title="Local-first access" icon={<Users className="size-5" />}><Readout label="Account requirement">Optional local account</Readout><Readout label="AI API keys">None</Readout><Readout label="Colab requirement">None</Readout><Note>Buddy manages the execution layer automatically. Provider names, external model pages and API details are intentionally hidden from creators. You stay inside Little Red's Big Studio.</Note></Panel>;
}
export function EnginePanel() {
  return <Panel eyebrow="Execution" title="Buddy-managed AI" icon={<Plug className="size-5" />}><Note>Buddy automatically chooses the best available engine for each job, checks its health, silently fails over when needed, and returns the finished result here. You never need to open or manage an external AI service.</Note><div className="grid gap-2 sm:grid-cols-2"><Readout label="Image generation">Buddy managed</Readout><Readout label="Music generation">Buddy managed</Readout><Readout label="Voice & conversion">Buddy managed</Readout><Readout label="Video generation">Buddy managed</Readout></div></Panel>;
}
export function SeoPanel() {
  return <Panel eyebrow="Module 15" title="YouTube SEO Workspace" icon={<Plug className="size-5" />}><Note>SEO generation is prepared as a free/open-model job. Buddy executes it directly whenever a healthy route is available.</Note></Panel>;
}
export function PluginPanel() {
  const [plugins, setPlugins] = useState<PublicPlugin[]>([]);
  useEffect(() => { listPlugins().then(setPlugins).catch(() => setPlugins([])); }, []);
  const readyCount = plugins.filter((plugin) => plugin.available).length;
  return <Panel eyebrow="AI capabilities" title="Buddy's Toolkit" icon={<Plug className="size-5" />}><Note>Buddy manages the underlying models automatically. This panel shows capabilities, not providers, so creators never have to leave the Studio to run an AI job.</Note><div className="grid gap-2 sm:grid-cols-2">{["Writing & lyrics", "Images & covers", "Full songs", "Voice & vocal conversion", "Stem separation", "Video & animation"].map((capability) => <div key={capability} className="rounded-xl border border-border bg-background/40 p-3 text-sm font-semibold">{capability}<div className="mt-1 text-[11px] font-normal text-muted-foreground">Buddy-managed</div></div>)}</div><p className="text-[11px] text-muted-foreground">{readyCount > 0 ? "Buddy has free execution routes available and will choose among them automatically." : "Buddy is checking available execution routes automatically."}</p></Panel>;
}
function TrialCountdown() {
  const { user } = useAuth(); const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => { if (!user) return; const started = ensureTrialStarted(user.id); const tick = () => setRemaining(Math.max(0, started + TRIAL_DURATION_MS - Date.now())); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [user?.id]);
  if (!user || remaining === null) return null;
  const totalSeconds = Math.floor(remaining / 1000); const days = Math.floor(totalSeconds / 86400); const hours = Math.floor((totalSeconds % 86400) / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const seconds = totalSeconds % 60; const active = remaining > 0;
  return <div className="rounded-2xl border border-red-400/20 bg-red-500/[.07] p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-red-200"><Clock3 className="size-4" /> {active ? "7-Day All-Access Trial" : "Trial Complete"}</div>{active ? <><div className="mt-2 font-display text-3xl font-black tabular-nums text-white">{days}d {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</div><p className="mt-1 text-xs text-white/55">Everything is unlocked during your trial. No watermark. Try it before you buy it.</p></> : <p className="mt-2 text-sm text-white/70">Your projects stay yours. Buddy Unlimited is $10/month for the full watermark-free experience.</p>}</div>;
}
export function SupportPanel() {
  return <Panel eyebrow="Free by design" title="Studio Support" icon={<Plug className="size-5" />}><TrialCountdown /><div className="mt-4 grid gap-2 sm:grid-cols-3"><a href="https://buymeacoffee.com/littleredbigsmile" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">☕💕 Buy Me a Coffee</a><a href="https://cash.app/$LittleRedBigSmile" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">💚 Cash App</a><a href="https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">🎙️✨ YouTube</a></div><Note>Buddy Unlimited is the $10/month membership. Supporter shout-outs are opt-in and automated; private supporters remain private. Payment verification and cross-device entitlement must be enforced by the trusted deployment backend, not browser storage.</Note></Panel>;
}
