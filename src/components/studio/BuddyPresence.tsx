import { AlertCircle, Brain, CheckCircle2, Ear, Loader2, Sparkles } from "lucide-react";
import { useSyncExternalStore } from "react";
import { buddyLine } from "@/lib/buddy-personality";
import { getBuddyStatus, subscribeBuddyStatus } from "@/lib/buddy-presence";
import type { BuddyStatus } from "@/lib/buddy-presence";
import { BuddyAnimatedAssistant } from "@/components/studio/BuddyAnimatedAssistant";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";
const STATUS_LABELS: Record<BuddyStatus, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  working: "Working",
  success: "Sorted",
  error: "Needs another go",
};
const STATUS_ICONS = {
  idle: Sparkles,
  listening: Ear,
  thinking: Brain,
  working: Loader2,
  success: CheckCircle2,
  error: AlertCircle,
} satisfies Record<BuddyStatus, typeof Sparkles>;

export function BuddyPresence({ className }: { className?: string }) {
  const snapshot = useSyncExternalStore(subscribeBuddyStatus, getBuddyStatus, getBuddyStatus);
  const Icon = STATUS_ICONS[snapshot.status];
  const line = snapshot.message ?? buddyLine(snapshot.status);
  return (
    <aside
      className={cn(
        "buddy-presence glass-panel relative overflow-hidden rounded-2xl p-3",
        className,
      )}
      data-buddy-status={snapshot.status}
      aria-label={`Buddy: ${STATUS_LABELS[snapshot.status]}`}
    >
      <div className="flex items-center gap-3">
        <BuddyAnimatedAssistant status={snapshot.status} compact className="size-14" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon
              className={cn(
                "size-3.5 text-primary",
                snapshot.status === "working" && "animate-spin",
              )}
              aria-hidden
            />
            <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {STATUS_LABELS[snapshot.status]}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{line}</p>
        </div>
        <img
          src={LOGO_URL}
          alt="Little Red's Big Studio"
          className="brand-mark-animated hidden h-8 w-auto shrink-0 rounded-md border border-white/10 bg-black/50 p-1 sm:block"
        />
      </div>
    </aside>
  );
}
