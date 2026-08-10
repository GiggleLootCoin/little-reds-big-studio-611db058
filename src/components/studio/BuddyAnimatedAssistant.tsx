import { cn } from "@/lib/utils";
import buddyReference from "../../../file_0000000070e8824391d24367b5f22d59.png";
import type { BuddyStatus } from "@/lib/buddy-presence";

const LABELS: Record<BuddyStatus, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  working: "Working",
  success: "Done",
  error: "Let's try that again",
};

export function BuddyAnimatedAssistant({
  status = "idle",
  compact = false,
  className,
}: {
  status?: BuddyStatus;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "buddy-assistant relative isolate",
        compact ? "size-24" : "size-40 sm:size-52",
        className,
      )}
      data-buddy-status={status}
      aria-label={`Buddy AI assistant — ${LABELS[status]}`}
      role="img"
    >
      <div className="buddy-aura absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
      <div className="buddy-heartbeat absolute inset-2 rounded-full border border-primary/25 bg-primary/5" />
      <div className="buddy-character relative mx-auto flex h-full w-full items-center justify-center">
        <div className="absolute inset-[9%] rounded-full border border-primary/20 bg-black/20 shadow-[0_20px_60px_oklch(0_0_0_/_0.5)] backdrop-blur-[2px]" />
        <img
          src={buddyReference}
          alt="Buddy"
          className="buddy-character-image relative z-10 h-[88%] w-[88%] object-contain drop-shadow-[0_18px_30px_oklch(0_0_0_/_0.55)]"
        />
        <div className="buddy-eye-light pointer-events-none absolute inset-[10%] z-20 rounded-full bg-[radial-gradient(circle_at_47%_35%,oklch(1_0_0_/_14%),transparent_32%)]" />
        <div className="buddy-talking-glow pointer-events-none absolute inset-x-1/4 bottom-[18%] z-20 h-1/4 rounded-full bg-primary/35 blur-xl" />
        <div className="buddy-waveform absolute bottom-[7%] left-1/2 z-30 flex h-7 -translate-x-1/2 items-end gap-1 rounded-full border border-primary/30 bg-black/75 px-2 py-1 backdrop-blur-md">
          {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
            <span key={bar} className="buddy-wave-bar block w-1 rounded-full bg-primary" />
          ))}
        </div>
      </div>
      <span className="absolute -bottom-1 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/35 bg-black/85 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary shadow-lg backdrop-blur-md">
        Buddy AI • {LABELS[status]}
      </span>
    </div>
  );
}
