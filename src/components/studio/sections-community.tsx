import { useEffect, useState } from "react";
import { ExternalLink, Heart, Plug, UserCircle2, Users } from "lucide-react";
import { FREE_RUNNERS } from "@/lib/free-runners";
import { listPlugins } from "@/lib/plugins.functions";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { Panel, Note, Readout, StudioButton } from "./ui";
import { Field, TextArea } from "./AiOutput";
import { FreeRunnerPanel } from "./FreeRunnerPanel";
import type { PublicPlugin } from "@/lib/plugins.registry.server";

export function SpotlightPanel() {
  return (
    <Panel eyebrow="Module 12" title="Artist Spotlight — Local" icon={<Heart className="size-5" />}>
      <Note>
        Your creator feed is now local-first. No hosted database is required. Use device storage for
        drafts and share finished work through your normal publishing platform.
      </Note>
    </Panel>
  );
}
export function ProfilePanel() {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile(user?.id);
  const [about, setAbout] = useState("");
  useEffect(() => setAbout(profile?.about || ""), [profile]);
  if (!profile)
    return (
      <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}>
        <Note>Loading local profile…</Note>
      </Panel>
    );
  return (
    <Panel eyebrow="Module 13" title="Creator Profile" icon={<UserCircle2 className="size-5" />}>
      <Field
        label="Display name"
        value={profile.display_name}
        onChange={(e) => {
          const p = { ...profile, display_name: e.target.value };
          setProfile(p);
          localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p));
        }}
      />
      <TextArea label="About" value={about} onChange={(e) => setAbout(e.target.value)} />
      <StudioButton
        className="w-full"
        onClick={() => {
          const p = { ...profile, about };
          setProfile(p);
          localStorage.setItem(`little-reds-profile:${profile.id}`, JSON.stringify(p));
        }}
      >
        Save locally
      </StudioButton>
    </Panel>
  );
}
export function AccessPanel() {
  return (
    <Panel eyebrow="Privacy" title="Local-first access" icon={<Users className="size-5" />}>
      <Readout label="Account requirement">None</Readout>
      <Readout label="AI API keys">None</Readout>
      <Readout label="Hosted database">None</Readout>
      <Note>
        Studio drafts, settings and creator profile stay in browser storage. Heavy AI runs use
        public free runners only when you choose one.
      </Note>
    </Panel>
  );
}
export function EnginePanel() {
  return (
    <Panel eyebrow="Execution" title="Free Execution Map" icon={<Plug className="size-5" />}>
      <FreeRunnerPanel />
      <div className="grid gap-2">
        {FREE_RUNNERS.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3"
          >
            <span className="text-sm">{r.name}</span>
            <a href={r.url} target="_blank" rel="noreferrer" className="text-primary">
              <ExternalLink className="size-4" />
            </a>
          </div>
        ))}
      </div>
    </Panel>
  );
}
export function SeoPanel() {
  return (
    <Panel eyebrow="Module 15" title="YouTube SEO Workspace" icon={<Plug className="size-5" />}>
      <Note>
        SEO generation is prepared as a free/open-model job. Copy the prepared prompt into a no-key
        open model runner, then paste the result back into the Studio.
      </Note>
    </Panel>
  );
}
export function PluginPanel() {
  const [plugins, setPlugins] = useState<PublicPlugin[]>([]);
  useEffect(() => {
    listPlugins()
      .then(setPlugins)
      .catch(() => setPlugins([]));
  }, []);
  return (
    <Panel eyebrow="Open Models" title="No-API Model Catalog" icon={<Plug className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Only source-controlled open models are listed. Commercial API providers are intentionally
        absent.
      </p>
      <div className="grid gap-2">
        {plugins.map((p) => (
          <div key={p.slug} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="font-display text-sm">{p.name}</div>
            <div className="text-xs text-muted-foreground">
              {p.capability} · {p.runtime}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
export function SupportPanel() {
  return (
    <Panel eyebrow="Free by design" title="Studio Support" icon={<Plug className="size-5" />}>
      <Note>
        Little Red&apos;s Big Studio is being rebuilt around open models, local browser storage and
        free public execution. There is no paid AI gateway hidden behind the controls.
      </Note>
    </Panel>
  );
}
