import { runnersFor, type FreeRunner } from "@/lib/free-runners";
import { BUDDY_KNOWLEDGE_POLICY, buddyKnowledgeContext } from "@/lib/buddy-knowledge";

export type BuddyTask = "writing" | "voice" | "music" | "stems" | "artwork" | "video";

export type BuddyPlan = {
  task: BuddyTask;
  mode: "local" | "free-open" | "unavailable";
  label: string;
  runner: FreeRunner | null;
  fallbacks: FreeRunner[];
  reason: string;
  knowledgePolicy: string;
};

const CAPABILITY: Record<BuddyTask, string> = {
  writing: "writing",
  voice: "voice",
  music: "music",
  stems: "stems",
  artwork: "image",
  video: "video",
};

// Browser APIs are capabilities, not AI models. Buddy only marks a task local
// when a real local implementation exists in the Studio.
function localCapability(_task: BuddyTask): boolean {
  return false;
}

function rankFreeRoutes(task: BuddyTask): FreeRunner[] {
  return runnersFor(CAPABILITY[task]);
}

/**
 * Users request outcomes, never model names. Buddy selects the first route
 * and keeps the rest as silent fallbacks for the orchestration layer.
 */
export function buddyPlan(task: BuddyTask): BuddyPlan {
  const knowledgePolicy = BUDDY_KNOWLEDGE_POLICY;
  const routes = rankFreeRoutes(task);
  const runner = routes[0] ?? null;

  if (localCapability(task)) {
    return {
      task,
      mode: "local",
      label: "Ready on this device",
      runner: null,
      fallbacks: [],
      reason: "Buddy can complete this part of the workflow locally.",
      knowledgePolicy,
    };
  }

  if (runner) {
    return {
      task,
      mode: "free-open",
      label: "Buddy will handle it",
      runner,
      fallbacks: routes.slice(1),
      reason: "Buddy selected the strongest configured free/open route and keeps fallbacks ready.",
      knowledgePolicy,
    };
  }

  return {
    task,
    mode: "unavailable",
    label: "Buddy needs another route",
    runner: null,
    fallbacks: [],
    reason: "No suitable local or free/open route is configured for this task.",
    knowledgePolicy,
  };
}

export function buddyKnowledge(mode: "reference" | "fact-check" | "creative" = "reference") {
  return buddyKnowledgeContext(mode);
}

/**
 * A browser cannot submit or monitor a third-party Space as if it were our
 * own backend. We therefore open only the selected route and never claim the
 * Studio completed an external generation it did not perform.
 */
export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);
  if (plan.mode === "free-open" && plan.runner && typeof window !== "undefined") {
    window.open(plan.runner.url, "_blank", "noopener,noreferrer");
  }
  return plan;
}
