import { ExternalLink, Smartphone, Cpu, Zap } from "lucide-react";
import { FREE_RUNNERS, runnersFor } from "@/lib/free-runners";
import { Panel, StudioButton } from "./ui";

export function FreeRunnerPanel({ capability }: { capability?: string }) {
  const runners = runnersFor(capability);
  return (
    <Panel eyebrow="No API required" title="Free Open-Source Runners" icon={<Zap className="size-5" />} defaultOpen>
      <p className="text-sm text-muted-foreground">
        Heavy AI runs outside the Studio when your Android phone cannot run the model locally. No paid API key is sent by the Studio.
      </p>
      <div className="grid gap-2">
        {runners.map((runner) => (
          <article key={runner.id} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {runner.kind === "android" ? <Smartphone className="size-4" /> : runner.kind === "gpu" ? <Cpu className="size-4" /> : <Zap className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-sm font-semibold">{runner.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{runner.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{runner.notes}</p>
              </div>
            </div>
            <StudioButton className="mt-3 w-full" onClick={() => window.open(runner.url, "_blank", "noopener,noreferrer")}>
              Open free runner <ExternalLink className="size-3.5" />
            </StudioButton>
          </article>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Best Android strategy: keep the Studio open in one tab and launch a public runner in another. For long/heavy jobs, use Kaggle or Lightning AI instead of Colab.
      </p>
    </Panel>
  );
}
