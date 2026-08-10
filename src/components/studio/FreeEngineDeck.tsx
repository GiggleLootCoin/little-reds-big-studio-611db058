import { Image, MessageCircle, Mic2, Music2, Film, AudioWaveform } from "lucide-react";

const features = [
  { icon: Music2, title: "Make a song", copy: "Turn an idea into music." },
  { icon: Mic2, title: "Work on vocals", copy: "Transform and shape your voice." },
  { icon: Image, title: "Create artwork", copy: "Build visuals for your music." },
  { icon: Film, title: "Make a video", copy: "Bring your music and visuals together." },
  { icon: AudioWaveform, title: "Clean the track", copy: "Separate and prepare your audio." },
  { icon: MessageCircle, title: "Talk to Buddy", copy: "Get help while you create." },
];

export function FreeEngineDeck() {
  return (
    <section className="rounded-2xl border border-primary/25 bg-background/45 p-4 shadow-[0_0_35px_hsl(var(--primary)/0.07)] backdrop-blur-md sm:p-5">
      <div className="mb-4">
        <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-primary">
          Your creative tools
        </p>
        <h2 className="mt-1 font-display text-lg font-bold">
          Everything you need, backstage handled
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Buddy automatically chooses the best available way to complete each job.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-xl border border-border/70 bg-background/55 p-3">
            <Icon className="size-4 text-primary" />
            <p className="mt-3 font-display text-xs font-semibold">{title}</p>
            <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
