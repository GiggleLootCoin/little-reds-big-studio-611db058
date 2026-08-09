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

/**
 * Only claim a task is local when the Studio can genuinely perform that task
 * without handing the user to another service. Browser capability alone is
 * not enough: WebGPU, WebAssembly and AudioWorklet are building blocks, not
 * proof that a complete generative model is installed on the phone.
 */
function localCapability(task: BuddyTask): boolean {
  if (typeof window === "undefined") return false;
  if (task === "writing") return typeof WebAssembly !== "undefined";
  return false;
}

function rankFreeRoutes(task: BuddyTask): FreeRunner[] {
  const routes = runnersFor(CAPABILITY[task]);
  return [...routes].sort((a, b) => {
    const score = (runner: FreeRunner) => {
      let value = 0;
      if (runner.kind === "android") value += 30;
      if (runner.kind === "public") value += 20;
      if (runner.kind === "gpu") value += 5;
      if (runner.capabilities.includes(CAPABILITY[task])) value += 20;
      return value;
    };
    return score(b) - score(a);
  });
}

/**
 * Buddy's user-facing routing policy. The caller asks for a creative task,
 * never a model. Local execution wins; otherwise Buddy selects the strongest
 * configured free/open route. Public-service availability is deliberately not
 * represented as guaranteed because those services can queue or change state.
 */
export function buddyPlan(task: BuddyTask): BuddyPlan {
  if (localCapability(task)) {
    return {
      task,
      mode: "local",
      label: "Ready on this device",
      runner: null,
      reason: "Buddy can complete this part of the workflow locally.",
    };
  }

  const runner = rankFreeRoutes(task)[0] ?? null;
  if (runner) {
    return {
      task,
      mode: "free-open",
      label: "Buddy will handle it",
      runner,
      reason: "Buddy selected the strongest configured free/open route for this task.",
    };
  }

  return {
    task,
    mode: "unavailable",
    label: "Buddy needs another route",
    runner: null,
    reason: "No suitable local or free/open route is configured for this task.",
  };
}

export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);
  if (plan.mode === "free-open" && plan.runner && typeof window !== "undefined") {
    window.open(plan.runner.url, "_blank", "noopener,noreferrer");
  }
  return plan;
}
