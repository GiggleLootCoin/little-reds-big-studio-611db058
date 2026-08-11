export type ProviderTask =
  | "chat"
  | "stt"
  | "tts"
  | "lyrics"
  | "image"
  | "music"
  | "video"
  | "voice-conversion"
  | "vocal-separation"
  | "lip-sync";

export type ProviderCandidate = {
  id: string;
  name: string;
  tasks: ProviderTask[];
  public: boolean;
  requiresApiKey: boolean;
  requiresPayment: boolean;
  requiresUserAccount: boolean;
  score?: number;
};

export type ProviderHealth = {
  failures: number;
  successes: number;
  cooldownUntil: number;
  lastError?: string;
  lastCheckedAt: number;
};

const health = new Map<string, ProviderHealth>();

export function isFreeCandidate(candidate: ProviderCandidate) {
  return (
    candidate.public &&
    !candidate.requiresApiKey &&
    !candidate.requiresPayment &&
    !candidate.requiresUserAccount
  );
}

export function isHealthy(candidate: ProviderCandidate, now = Date.now()) {
  const state = health.get(candidate.id);
  return !state || state.cooldownUntil <= now;
}

export function rankFreeCandidates(candidates: ProviderCandidate[], task: ProviderTask) {
  return candidates
    .filter(
      (candidate) =>
        candidate.tasks.includes(task) && isFreeCandidate(candidate) && isHealthy(candidate),
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function recordProviderSuccess(id: string) {
  const previous = health.get(id) ?? {
    failures: 0,
    successes: 0,
    cooldownUntil: 0,
    lastCheckedAt: 0,
  };
  health.set(id, {
    ...previous,
    successes: previous.successes + 1,
    failures: 0,
    cooldownUntil: 0,
    lastCheckedAt: Date.now(),
    lastError: undefined,
  });
}

export function recordProviderFailure(id: string, error: unknown) {
  const previous = health.get(id) ?? {
    failures: 0,
    successes: 0,
    cooldownUntil: 0,
    lastCheckedAt: 0,
  };
  const failures = previous.failures + 1;
  const cooldownMs = Math.min(15 * 60_000, 15_000 * 2 ** Math.min(failures - 1, 6));
  health.set(id, {
    ...previous,
    failures,
    cooldownUntil: Date.now() + cooldownMs,
    lastCheckedAt: Date.now(),
    lastError: error instanceof Error ? error.message : String(error),
  });
}

export function clearProviderHealth() {
  health.clear();
}
