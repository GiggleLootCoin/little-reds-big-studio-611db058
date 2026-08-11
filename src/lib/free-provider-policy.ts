export type FreeProviderState = {
  failures: number;
  cooldownUntil: number;
  lastError?: string;
};

const KEY = "lrbgs-free-provider-policy-v1";
const BASE_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 30 * 60_000;

function read(): Record<string, FreeProviderState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, FreeProviderState>;
  } catch {
    return {};
  }
}

function write(value: Record<string, FreeProviderState>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage is optional */
  }
}

export function providerAvailable(id: string) {
  if (typeof window === "undefined") return true;
  const state = read()[id];
  return !state || state.cooldownUntil <= Date.now();
}

export function markProviderSuccess(id: string) {
  if (typeof window === "undefined") return;
  const all = read();
  delete all[id];
  write(all);
}

export function markProviderFailure(id: string, error: unknown) {
  if (typeof window === "undefined") return;
  const all = read();
  const previous = all[id]?.failures ?? 0;
  const failures = previous + 1;
  const cooldownUntil =
    Date.now() + Math.min(MAX_COOLDOWN_MS, BASE_COOLDOWN_MS * 2 ** Math.min(failures - 1, 5));
  all[id] = {
    failures,
    cooldownUntil,
    lastError: error instanceof Error ? error.message : String(error),
  };
  write(all);
}

export function providerCooldownMessage(id: string) {
  if (typeof window === "undefined") return "";
  const state = read()[id];
  if (!state || state.cooldownUntil <= Date.now()) return "";
  const seconds = Math.max(1, Math.ceil((state.cooldownUntil - Date.now()) / 1000));
  return `${id} is temporarily cooling down (${seconds}s)`;
}
