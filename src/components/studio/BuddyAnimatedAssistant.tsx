import "./buddy-life.css";
import { cn } from "@/lib/utils";
import buddyReference from "../../../file_0000000070e8824391d24367b5f22d59.png";
import type { BuddyStatus } from "@/lib/buddy-presence";
const LABELS: Record<BuddyStatus, string> = { idle: "Buddy", listening: "Listening", thinking: "Thinking", working: "Working", success: "Done", error: "Let's try again" };
export function BuddyAnimatedAssistant({ status = "idle", compact = false, className }: { status?: BuddyStatus; compact?: boolean; className?: string }) {
  return <div className={cn("buddy-assistant relative isolate", compact ? "size-28" : "size-52 sm:size-64", className)} data-buddy-status={status} aria-label={`${LABELS[status]} — animated assistant`} role="img">
    <div className="buddy-aura absolute inset-[-8%] rounded-full bg-primary/25 blur-3xl" />
    <div className="absolute inset-[4%] rounded-full border border-primary/20 shadow-[inset_0_0_45px_oklch(0.7_0.2_20_/_0.08),0_0_60px_oklch(0.6_0.24_26_/_0.18)]" />
    <div className="buddy-character relative h-full w-full overflow-hidden rounded-full border border-primary/25 bg-[radial-gradient(circle_at_50%_38%,oklch(0.22_0.08_22),oklch(0.07_0.02_18)_72%)] shadow-[0_24px_80px_oklch(0_0_0_/_0.65)]">
      <img src={buddyReference} alt="Buddy" className="buddy-character-image h-full w-full scale-[1.08] object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_48%_30%,oklch(1_0_0_/_18%),transparent_28%),linear-gradient(180deg,transparent_58%,oklch(0_0_0_/_24%))]" />
      <div className="buddy-blink pointer-events-none absolute left-[34%] top-[35%] h-[2%] w-[8%] rounded-full bg-white/70 blur-[1px]" />
      <div className="buddy-blink pointer-events-none absolute left-[58%] top-[35%] h-[2%] w-[8%] rounded-full bg-white/70 blur-[1px]" />
      <div className="buddy-mouth pointer-events-none absolute bottom-[25%] left-1/2 h-[7%] w-[18%] rounded-full border border-primary/40 bg-primary/20 shadow-[0_0_22px_oklch(0.6_0.24_26_/_0.4)]" />
      <div className="absolute inset-x-[30%] bottom-[9%] flex h-[9%] items-end justify-center gap-1 opacity-80" aria-hidden>{[2,5,3,7,4,6,2].map((h, i) => <span key={i} className="buddy-bar w-[7%] rounded-full bg-primary" style={{ height: `${h * 10}%`, animationDelay: `${i * 70}ms` }} />)}</div>
    </div>
    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-primary/35 bg-black/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary shadow-lg backdrop-blur-md">{LABELS[status]}</span>
  </div>;
}
