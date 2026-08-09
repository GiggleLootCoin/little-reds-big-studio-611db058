import { runnersFor, type FreeRunner } from "@/lib/free-runners";

export type BuddyTask = "writing" | "voice" | "music" | "stems" | "artwork" | "video";

export type BuddyPlan = {
  task: BuddyTask;
  mode: "local" | "free-open" | "unavailable";
  label: string;
  runner: FreeRunner | null;
  reason: string;
};

const CAPABILITY: Record<BuddyTask, string> = {
  writing: "text",
  voice: "voice",
  music: "music",
  stems: "stems",
  artwork: "image",
  video: "video",
};

function localCapability(task: BuddyTask): boolean {
  if (typeof window === "undefined") return false;
  if (task === "writing") return typeof WebAssembly !== "undefined";
  if (task === "voice") return typeof WebAssembly !== "undefined" && "AudioWorkletNode" in window;
  if (task === "music" || task === "artwork" || task === "video") return "gpu" in navigator;
  if (task === "stems") return typeof WebAssembly !== "undefined" && "AudioWorkletNode" in window;
  return false;
}

/**
 * Buddy's routing policy. Model names are deliberately kept out of the UI.
 * Local processing wins; otherwise Buddy chooses the first free/open route.
 * External availability is re-evaluated when a task is started rather than
 * being treated as permanently guaranteed.
 */
export function buddyPlan(task: BuddyTask): BuddyPlan {
  if (localCapability(task)) {
    return {
      task,
      mode: "local",
      label: "On your phone",
      runner: null,
      reason: "Your device has the browser capability needed for this task.",
    };
  }

  const runner = runnersFor(CAPABILITY[task])[0] ?? null;
  if (runner) {
    return {
      task,
      mode: "free-open",
      label: "Buddy's free route",
      runner,
      reason: "Buddy selected the best available free/open route configured for this task.",
    };
  }

  return {
    task,
    mode: "unavailable",
    label: "Not available yet",
    runner: null,
    reason: "No suitable local or free/open route is configured for this task.",
  };
}

export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);
  if (plan.mode === "free-open" && plan.runner) {
    window.open(plan.runner.url, "_blank", "noopener,noreferrer");
  }
  return plan;
}
