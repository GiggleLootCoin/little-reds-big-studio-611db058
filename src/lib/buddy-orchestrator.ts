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

/** Buddy chooses the execution route internally. Provider identity is never a user-facing navigation path. */
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
      reason: "Buddy can handle this task locally and will use an internal free route only when heavier generation is needed.",
      knowledgePolicy,
    };
  }

  if (runner) {
    return {
      task,
      mode: "free-open",
      label: "Buddy is choosing the best available route",
      runner,
      fallbacks: routes.slice(1),
      reason: "Buddy checks available execution routes and silently fails over when one is sleeping, busy, or unavailable.",
      knowledgePolicy,
    };
  }

  return {
    task,
    mode: "unavailable",
    label: "Buddy needs another route",
    runner: null,
    fallbacks: [],
    reason: "No suitable local or free execution route is configured for this task.",
    knowledgePolicy,
  };
}

export function buddyKnowledge(mode: "reference" | "fact-check" | "creative" = "reference") {
  return buddyKnowledgeContext(mode);
}

/** Compatibility helper: never opens an external provider. Execution stays inside the Studio runtime. */
export function openBuddyRoute(task: BuddyTask) {
  const plan = buddyPlan(task);

  if (plan.mode === "unavailable") {
    setBuddyStatus("error", { task, message: "Buddy could not find a working internal route for that task." });
    return plan;
  }

  setBuddyStatus("working", {
    task,
    message: "Buddy is choosing and running the best available engine inside the Studio.",
  });

  return plan;
}
