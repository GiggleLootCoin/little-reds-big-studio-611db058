import { useEffect, useState } from "react";
import { HardDrive, Smartphone, WifiOff, Zap } from "lucide-react";
import { detectLocalRuntime, isAndroidLike, localRuntimeSummary, type LocalRuntimeCapabilities } from "@/lib/local-first/runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CapabilityCheck = readonly [label: string, available: boolean];

export function LocalEnginePanel() {
  const [capabilities, setCapabilities] = useState<LocalRuntimeCapabilities | null>(null);

  useEffect(() => {
    void detectLocalRuntime().then(setCapabilities);
  }, []);

  const checks: CapabilityCheck[] = capabilities
    ? [
        ["IndexedDB project storage", capabilities.indexedDb],
        ["WebAssembly processing", capabilities.webAssembly],
        ["Web Workers", capabilities.webWorkers],
        ["WebGPU acceleration", capabilities.webGpu],
        ["Local audio recording", capabilities.mediaRecorder],
        ["AudioWorklet processing", capabilities.audioWorklet],
        ["Direct file access", capabilities.fileSystemAccess],
      ]
    : [];

  return (
    <Card className="border-primary/20 bg-background/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Smartphone aria-hidden className="size-5 text-primary" />
          Your Phone Is The Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {capabilities?.webGpu ? <Zap aria-hidden className="size-4 text-primary" /> : <HardDrive aria-hidden className="size-4 text-primary" />}
            {capabilities ? localRuntimeSummary(capabilities) : "Checking this device…"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Local-first mode does not require an AI API key, subscription, or hosted database.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {checks.map(([label, available]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs">
              <span>{label}</span>
              <span className={available ? "font-semibold text-primary" : "text-muted-foreground"}>
                {available ? "Available" : "Unavailable"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            {isAndroidLike()
              ? "Android detected. Projects can stay on this phone and the Studio can use local browser compute whenever supported."
              : "This device can use the same local-first architecture; Android is the primary target."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
