import { useEffect, useState } from "react";
import { Clock3, Heart, Plug, UserCircle2, Users } from "lucide-react";
import { listPlugins } from "@/lib/plugins.functions";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { getEntitlement, type Entitlement } from "@/lib/supabase-rest";
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
  return <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}>
    <Field label="Display name" value={profile.display_name} onChange={(e) => { const p = { ...profile, display_name: e.target.value }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }} />
    <TextArea label="About" value={about} onChange={(e) => setAbout(e.target.value)} />
    <StudioButton className="w-full" onClick={() => { const p = { ...profile, about }; setProfile(p); localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p)); }}>Save locally</StudioButton>
  </Panel>;
}
export function AccessPanel() {
  return <Panel eyebrow="Privacy" title="Account access" icon={<Users className="size-5" />}><Readout label="Account">Optional for basic use</Readout><Readout label="AI API keys">None</Readout><Readout label="Colab requirement">None</Readout><Note>Buddy manages the execution layer automatically. Sign in to receive your 7-day all-access trial and to keep membership entitlements across devices.</Note></Panel>;
}
export function EnginePanel() {
  return <Panel eyebrow="Execution" title="Buddy-managed AI" icon={<Plug className="size-5" />}><Note>Buddy automatically chooses the best available engine for each job, checks its health, silently fails over when needed, and returns the finished result here.</Note><div className="grid gap-2 sm:grid-cols-2"><Readout label="Image generation">Buddy managed</Readout><Readout label="Music generation">Buddy managed</Readout><Readout label="Voice & conversion">Buddy managed</Readout><Readout label="Video generation">Buddy managed</Readout></div></Panel>;
}
export function SeoPanel() { return <Panel eyebrow="Module 15" title="YouTube SEO Workspace" icon={<Plug className="size-5" />}><Note>SEO generation is prepared as a free/open-model job. Buddy executes it directly whenever a healthy route is available.</Note></Panel>; }
export function PluginPanel() {
  const [plugins, setPlugins] = useState<PublicPlugin[]>([]); useEffect(() => { listPlugins().then(setPlugins).catch(() => setPlugins([])); }, []); const readyCount = plugins.filter((plugin) => plugin.available).length;
  return <Panel eyebrow="AI capabilities" title="Buddy's Toolkit" icon={<Plug className="size-5" />}><Note>Buddy manages the underlying models automatically. This panel shows capabilities, not providers.</Note><div className="grid gap-2 sm:grid-cols-2">{["Writing & lyrics","Images & covers","Full songs","Voice & vocal conversion","Stem separation","Video & animation"].map((capability) => <div key={capability} className="rounded-xl border border-border bg-background/40 p-3 text-sm font-semibold">{capability}<div className="mt-1 text-[11px] font-normal text-muted-foreground">Buddy-managed</div></div>)}</div><p className="text-[11px] text-muted-foreground">{readyCount > 0 ? "Buddy has free execution routes available and will choose among them automatically." : "Buddy is checking available execution routes automatically."}</p></Panel>;
}
function TrialCountdown({ entitlement }: { entitlement: Entitlement }) {
  const ends = new Date(entitlement.trial_ends_at).getTime(); const [remaining, setRemaining] = useState(Math.max(0, ends - Date.now()));
  useEffect(() => { const tick = () => setRemaining(Math.max(0, ends - Date.now())); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [ends]);
  const totalSeconds = Math.floor(remaining / 1000); const days = Math.floor(totalSeconds / 86400); const hours = Math.floor((totalSeconds % 86400) / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const seconds = totalSeconds % 60;
  if (entitlement.membership_active) return <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[.08] p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">Buddy Unlimited — Active</div><p className="mt-2 text-sm text-white/70">Full Studio access and Buddy Unleashed are enabled while your membership is active.</p></div>;
  return <div className="rounded-2xl border border-red-400/20 bg-red-500/[.07] p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-red-200"><Clock3 className="size-4" /> {remaining > 0 ? "7-Day All-Access Trial" : "Trial Complete"}</div>{remaining > 0 ? <><div className="mt-2 font-display text-3xl font-black tabular-nums text-white">{days}d {String(hours).padStart(2,"0")}:{String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}</div><p className="mt-1 text-xs text-white/55">Unlimited Studio access is active during your trial.</p></> : <p className="mt-2 text-sm text-white/70">Your trial has ended. Join Buddy Unlimited for $10/month to restore unlimited access and unlock Buddy Unleashed.</p>}</div>;
}
export function SupportPanel() {
  const { user } = useAuth(); const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  useEffect(() => { let alive = true; const load = async () => { const session = user ? (await import("@/lib/supabase-rest")).getStoredSession() : null; if (!session?.access_token) return; try { const value = await getEntitlement(session.access_token); if (alive) setEntitlement(value); } catch { if (alive) setEntitlement(null); } }; void load(); return () => { alive = false; }; }, [user?.id]);
  return <Panel eyebrow="Free by design" title="Studio Support & Membership" icon={<Plug className="size-5" />}>
    {entitlement ? <TrialCountdown entitlement={entitlement} /> : <Note>Sign in to activate your secure 7-day all-access trial.</Note>}
    <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/[.06] p-4"><div className="text-sm font-black">Buddy Unlimited — $10/month</div><p className="mt-1 text-xs text-muted-foreground">Unlimited Studio access plus Buddy Unleashed. Membership status is verified server-side from Buy Me a Coffee.</p><a href="https://buymeacoffee.com/littleredbigsmile" target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-background/50 p-3 text-sm font-bold hover:bg-background/80">☕ Join Buddy Unlimited — $10/month</a></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href="https://cash.app/$LittleRedBigSmile" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">💚 Cash App — support</a><a href="https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/40 p-3 text-center text-sm font-semibold hover:bg-background/70">🎙️✨ YouTube</a></div>
    <Note>Buy Me a Coffee memberships renew monthly or yearly and can be connected to the Studio through signed webhooks. citeturn0search2turn0search5</Note>
  </Panel>;
}
