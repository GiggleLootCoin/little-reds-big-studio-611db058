import { runnersFor, type FreeRunner } from "@/lib/free-runners";
import { BUDDY_KNOWLEDGE_POLICY, buddyKnowledgeContext } from "@/lib/buddy-knowledge";
import { setBuddyStatus } from "@/lib/buddy-presence";

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

function localCapability(task: BuddyTask): boolean {
  return task === "writing";
}

function rankFreeRoutes(task: BuddyTask): FreeRunner[] {
  return runnersFor(CAPABILITY[task]);
}

/**
 * Buddy chooses outcomes, not provider names. Local browser work is preferred
 * when the device can perform it; otherwise the strongest configured free/open
 * route is selected and the remaining routes stay available as fallbacks.
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
      fallbacks: routes,
      reason:
        "Buddy can handle this task locally and will use public free routes only when heavier generation is needed.",
      knowledgePolicy,
    };
  }

  if (runner) {
    return {
      task,
      mode: "free-open",
      label: "Buddy will choose the best available free engine",
      runner,
      fallbacks: routes.slice(1),
      reason:
        "Buddy ranks free/open routes and keeps alternatives ready when a public engine is sleeping, busy, or unavailable.",
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

export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);

  if (plan.mode === "unavailable") {
    setBuddyStatus("error", {
      task,
      message: "That route isn't available right now. Buddy won't pretend otherwise.",
    });
    return plan;
  }

  if (plan.mode === "local") {
    setBuddyStatus("working", { task, message: null });
    return plan;
  }

  if (plan.runner && typeof window !== "undefined") {
    setBuddyStatus("working", {
      task,
      message: `Checking ${plan.runner.name} and its free fallbacks. Buddy will only report a completed result after the Studio receives the artifact.`,
    });
    window.open(plan.runner.url, "_blank", "noopener,noreferrer");
  }

  return plan;
}
