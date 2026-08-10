import {
  ExternalLink,
  MessageCircle,
  Mic2,
  Music2,
  Image,
  Film,
  AudioWaveform,
} from "lucide-react";
import { FREE_RUNNERS } from "@/lib/free-runners";

const featured = [
  {
    id: "hf-ace-step",
    icon: Music2,
    label: "Make a song",
    note: "ACE-Step 1.5 — full-song generation",
  },
  { id: "hf-rvc", icon: Mic2, label: "Voice conversion", note: "Applio / RVC" },
  { id: "hf-z-image", icon: Image, label: "Make artwork", note: "Z Image Turbo" },
  { id: "hf-wan-s2v", icon: Film, label: "Make video", note: "Wan 2.2 S2V" },
  { id: "hf-demucs", icon: AudioWaveform, label: "Split stems", note: "Demucs" },
  { id: "qwen3-webgpu", icon: MessageCircle, label: "Free local chat", note: "Qwen3 WebGPU" },
];

export function FreeEngineDeck() {
  return (
    <section className="rounded-2xl border border-primary/30 bg-background/55 p-4 shadow-[0_0_35px_hsl(var(--primary)/0.08)] backdrop-blur-md sm:p-5">
      <div className="mb-4">
        <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-primary">
          Free engine deck
        </p>
        <h2 className="mt-1 font-display text-lg font-bold">
          Real tools. No API keys. No paid plan.
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          These are direct free/open routes. The Studio never pretends a remote model ran locally
          when it did not.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {featured.map(({ id, icon: Icon, label, note }) => {
          const runner = FREE_RUNNERS.find((r) => r.id === id);
          if (!runner) return null;
          return (
            <a
              key={id}
              href={runner.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-border/70 bg-background/55 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className="size-4 text-primary" />
                <ExternalLink className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 font-display text-xs font-semibold">{label}</p>
              <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground">{note}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
