import { cn } from "@/lib/utils";
import buddyReference from "../../../file_0000000070e8824391d24367b5f22d59.png";
import type { BuddyStatus } from "@/lib/buddy-presence";
const LABELS: Record<BuddyStatus, string> = {
  idle: "Buddy",
  listening: "Listening",
  thinking: "Thinking",
  working: "Working",
  success: "Done",
  error: "Let's try again",
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
        compact ? "size-24" : "size-44 sm:size-56",
        className,
      )}
      data-buddy-status={status}
      aria-label={`${LABELS[status]} — animated assistant`}
      role="img"
    >
      <div className="buddy-aura absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
      <div className="buddy-heartbeat absolute inset-2 rounded-full border border-primary/35 bg-primary/5 animate-pulse" />
      <div className="absolute inset-3 rounded-full border border-primary/20 animate-pulse" />
      <div className="buddy-character relative mx-auto h-full w-full overflow-hidden rounded-[38%] border border-primary/30 bg-black/45 shadow-[0_20px_70px_oklch(0_0_0_/_0.6)] backdrop-blur-md">
        <img
          src={buddyReference}
          alt="Buddy"
          className="buddy-character-image h-full w-full object-contain"
        />
        <div className="buddy-eye-light pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_47%_35%,oklch(1_0_0_/_16%),transparent_35%)]" />
        <div className="buddy-talking-glow pointer-events-none absolute inset-x-1/4 bottom-1/4 h-1/4 rounded-full bg-primary/35 blur-xl animate-pulse" />
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1"
          aria-hidden
        >
          {[1, 2, 3, 4, 3, 2].map((h, i) => (
            <span
              key={i}
              className={cn("w-1 rounded-full bg-primary/80 animate-pulse", i % 2 ? "h-3" : "h-2")}
            />
          ))}
        </div>
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-black/85 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary shadow-lg backdrop-blur-md">
        {LABELS[status]}
      </span>
    </div>
  );
}
