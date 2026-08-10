import { cn } from "@/lib/utils";
import buddyReference from "../../../file_0000000070e8824391d24367b5f22d59.png";
import type { BuddyStatus } from "@/lib/buddy-presence";

const LABELS: Record<BuddyStatus, string> = {
  idle: "Buddy",
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
        compact ? "size-20" : "size-36 sm:size-48",
        className,
      )}
      data-buddy-status={status}
      aria-label={`${LABELS[status]} — animated Buddy assistant`}
      role="img"
    >
      <div className="buddy-aura absolute inset-2 rounded-full bg-primary/25 blur-2xl" />
      <div className="buddy-heartbeat absolute inset-1 rounded-full border border-primary/25 bg-primary/5" />
      <div className="buddy-character relative mx-auto h-full w-full overflow-hidden rounded-[30%] border border-white/15 bg-black/35 shadow-[0_20px_60px_oklch(0_0_0_/_0.5)] backdrop-blur-md">
        <img
          src={buddyReference}
          alt=""
          className="buddy-character-image h-full w-full object-contain"
        />
        <div className="buddy-eye-light pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_47%_35%,oklch(1_0_0_/_12%),transparent_35%)]" />
        <div className="buddy-talking-glow pointer-events-none absolute inset-x-1/4 bottom-1/4 h-1/4 rounded-full bg-primary/30 blur-xl" />
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-primary/35 bg-black/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary shadow-lg backdrop-blur-md">
        {LABELS[status]}
      </span>
    </div>
  );
}
