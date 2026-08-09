import { runnersFor, type FreeRunner } from "@/lib/free-runners";
import { BUDDY_KNOWLEDGE_POLICY, buddyKnowledgeContext } from "@/lib/buddy-knowledge";

export type BuddyTask = "writing" | "voice" | "music" | "stems" | "artwork" | "video";

export type BuddyPlan = {
  task: BuddyTask;
  mode: "local" | "free-open" | "unavailable";
  label: string;
  runner: FreeRunner | null;
  reason: string;
  knowledgePolicy: string;
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
 * Buddy's routing policy. Users request creative outcomes, never model names.
 * Red's private knowledge layer informs perspective and creative reasoning;
 * it is deliberately not treated as a database of verified facts.
 */
export function buddyPlan(task: BuddyTask): BuddyPlan {
  const knowledgePolicy = BUDDY_KNOWLEDGE_POLICY;

  if (localCapability(task)) {
    return {
      task,
      mode: "local",
      label: "Ready on this device",
      runner: null,
      reason: "Buddy can complete this part of the workflow locally.",
      knowledgePolicy,
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
      knowledgePolicy,
    };
  }

  return {
    task,
    mode: "unavailable",
    label: "Buddy needs another route",
    runner: null,
    reason: "No suitable local or free/open route is configured for this task.",
    knowledgePolicy,
  };
}

/** Returns the private knowledge context for future text/creative providers. */
export function buddyKnowledge(mode: "reference" | "fact-check" | "creative" = "reference") {
  return buddyKnowledgeContext(mode);
}

export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);
  if (plan.mode === "free-open" && plan.runner && typeof window !== "undefined") {
    window.open(plan.runner.url, "_blank", "noopener,noreferrer");
  }
  return plan;
}
