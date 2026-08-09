import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function openStudioPanel(id: string) {
  window.dispatchEvent(new CustomEvent("studio:open-panel", { detail: id }));
}

export function Panel({ id, title, eyebrow, icon, defaultOpen = false, children }: { id?: string; title: string; eyebrow?: string; icon?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== panelId) return;
      setOpen(true);
      requestAnimationFrame(() => document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    window.addEventListener("studio:open-panel", handler);
    return () => window.removeEventListener("studio:open-panel", handler);
  }, [panelId]);
  return <section id={panelId} className={cn("glass-panel animate-fade-in scroll-mt-24 overflow-hidden rounded-2xl transition-shadow duration-300", open && "animate-pulse-glow")}>
    <button type="button" aria-expanded={open} aria-controls={`${panelId}-content`} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/40">
      <span aria-hidden className="crimson-gloss flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">{icon}</span>
      <span className="min-w-0 flex-1">{eyebrow && <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</span>}<span className="block truncate font-display text-base font-semibold">{title}</span></span>
      <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180 text-primary")} />
    </button>
    <div id={`${panelId}-content`} hidden={!open} className="animate-fade-in space-y-4 border-t border-border/60 px-4 pb-5 pt-4">{children}</div>
  </section>;
}

export function StudioSlider({ label, value, min = 0, max = 100, step = 1, unit = "", onChange }: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const fill = ((value - min) / (max - min)) * 100;
  return <label className="block space-y-1.5"><span className="flex items-baseline justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-display text-xs text-primary">{value}{unit}</span></span><input type="range" className="studio-slider" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ ["--fill" as string]: `${fill}%` }} /></label>;
}

export function StudioButton({ children, variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return <button {...props} className={cn("hover-lift relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 font-display text-sm font-semibold tracking-wide transition-transform duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50", variant === "primary" ? "crimson-gloss text-primary-foreground" : "border border-border bg-secondary/50 text-foreground hover:bg-secondary", className)}>{children}</button>;
}

export function Chip({ children }: { children: ReactNode }) { return <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">{children}</span>; }

export function Readout({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return <div className="rounded-xl border border-border bg-background/50 p-3"><div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</div><div className="font-display text-sm text-primary">{value ?? children}</div></div>;
}

export function Note({ children }: { children: ReactNode }) { return <p className="rounded-xl border border-dashed border-border/70 bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">{children}</p>; }
