import { Plug } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, Note } from "./ui";
import { listPlugins } from "@/lib/plugins.functions";
import type { PublicPlugin } from "@/lib/plugins.registry.server";

export function CommunityPanel() {
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
        Little Red&apos;s Big Studio is being rebuilt around open models, local browser storage and free
        public execution. There is no paid AI gateway hidden behind the controls.
      </Note>
    </Panel>
  );
}
