import "./buddy-life.css";
import { cn } from "@/lib/utils";
import buddyReference from "../../../file_0000000070e8824391d24367b5f22d59.png";
import type { BuddyStatus } from "@/lib/buddy-presence";

const LABELS: Record<BuddyStatus, string> = { idle: "Buddy", listening: "Listening", thinking: "Thinking", working: "Working", success: "Done", error: "Let's try again" };

export function BuddyAnimatedAssistant({ status = "idle", compact = false, className }: { status?: BuddyStatus; compact?: boolean; className?: string }) {
  return (
    <div className={cn("buddy-assistant relative isolate", compact ? "size-28" : "size-52 sm:size-64", className)} data-buddy-status={status} aria-label={`${LABELS[status]} — animated assistant`} role="img">
      <div className="buddy-aura absolute inset-[-12%] rounded-full" />
      <div className="buddy-ring absolute inset-[-3%] rounded-full" />
      <div className="buddy-character relative h-full w-full overflow-hidden rounded-full border border-white/15 bg-[radial-gradient(circle_at_50%_35%,#351019,#090509_70%)] shadow-[0_28px_90px_rgba(0,0,0,.7)]">
        <div className="buddy-head-motion absolute inset-[-3%]">
          <img src={buddyReference} alt="Buddy" className="buddy-character-image h-full w-full scale-[1.09] object-cover object-center" />
          <div className="buddy-face-light pointer-events-none absolute inset-0" />
          <div className="buddy-eye-glint pointer-events-none absolute left-[34%] top-[35%] h-[3%] w-[8%] rounded-full bg-white/80 blur-[1px]" />
          <div className="buddy-eye-glint pointer-events-none absolute left-[58%] top-[35%] h-[3%] w-[8%] rounded-full bg-white/80 blur-[1px]" />
          <div className="buddy-blink pointer-events-none absolute left-[33%] top-[34.5%] h-[3%] w-[10%] rounded-full bg-black/75" />
          <div className="buddy-blink pointer-events-none absolute left-[57%] top-[34.5%] h-[3%] w-[10%] rounded-full bg-black/75" />
          <div className="buddy-mouth pointer-events-none absolute bottom-[24%] left-1/2 h-[7%] w-[18%] rounded-[50%] border border-red-200/40 bg-red-500/20" />
        </div>
        <div className="buddy-sheen pointer-events-none absolute inset-0" />
        <div className="buddy-pulse pointer-events-none absolute inset-[10%] rounded-full border border-red-300/10" />
        <div className="absolute inset-x-[29%] bottom-[8%] flex h-[10%] items-end justify-center gap-1 opacity-85" aria-hidden>
          {[2, 5, 3, 7, 4, 6, 2].map((h, i) => <span key={i} className="buddy-bar w-[7%] rounded-full bg-red-300" style={{ height: `${h * 10}%`, animationDelay: `${i * 70}ms` }} />)}
        </div>
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-red-300/25 bg-black/75 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-red-200 shadow-lg backdrop-blur-md">{LABELS[status]}</span>
    </div>
  );
}
