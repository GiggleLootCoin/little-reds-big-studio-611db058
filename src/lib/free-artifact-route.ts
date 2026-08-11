import { getFreeRuntimeHealth } from "./gradio-free";

/** Resolve the actual free Space that most recently returned a successful result. */
export function lastSuccessfulFreeSpace(logicalId: string, fallback: string) {
  const health = getFreeRuntimeHealth() as Record<string, { lastSuccessAt?: number }>;
  let best = fallback;
  let bestAt = 0;
  for (const [key, state] of Object.entries(health)) {
    if (!key.startsWith(`${logicalId}:`)) continue;
    const at = Number(state?.lastSuccessAt ?? 0);
    if (at > bestAt) {
      bestAt = at;
      best = key.slice(logicalId.length + 1);
    }
  }
  return best;
}
