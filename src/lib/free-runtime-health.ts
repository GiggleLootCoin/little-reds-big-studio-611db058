const STORAGE_KEY = "lrbgs-free-runtime-health-v2";

type Health = {
  failures: number;
  successes: number;
  unavailableUntil: number;
  lastSuccessAt: number;
  lastCheckedAt: number;
  lastError?: string;
};

const memory = new Map<string, Health>();
let initialized = false;

function load() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Health>;
    for (const [id, value] of Object.entries(parsed)) memory.set(id, value);
  } catch {
    // Corrupt browser state must never break generation.
  }
}

function persist() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory)));
  } catch {
    // Private browsing/storage limits must not break runtime operation.
  }
}

function ensureLoaded() {
  if (!initialized) {
    initialized = true;
    load();
  }
}

export function runtimeHealth(id: string): Health {
  ensureLoaded();
  return memory.get(id) ?? {
    failures: 0,
    successes: 0,
    unavailableUntil: 0,
    lastSuccessAt: 0,
    lastCheckedAt: 0,
  };
}

export function isRuntimeAvailable(id: string, now = Date.now()) {
  return runtimeHealth(id).unavailableUntil <= now;
}

export function recordRuntimeSuccess(id: string) {
  ensureLoaded();
  const previous = runtimeHealth(id);
  memory.set(id, {
    ...previous,
    successes: previous.successes + 1,
    failures: 0,
    unavailableUntil: 0,
    lastSuccessAt: Date.now(),
    lastCheckedAt: Date.now(),
    lastError: undefined,
  });
  persist();
}

export function recordRuntimeFailure(id: string, error: unknown) {
  ensureLoaded();
  const previous = runtimeHealth(id);
  const message = error instanceof Error ? error.message : String(error);
  const quota = /zero.?gpu|quota|capacity|rate.?limit|too many requests|resource exhausted|429/i.test(message);
  const failures = previous.failures + 1;
  const cooldown = quota
    ? 30 * 60_000
    : Math.min(15 * 60_000, 15_000 * 2 ** Math.min(failures - 1, 6));
  memory.set(id, {
    ...previous,
    failures,
    unavailableUntil: Date.now() + cooldown,
    lastCheckedAt: Date.now(),
    lastError: message.slice(0, 500),
  });
  persist();
}

export function allRuntimeHealth() {
  ensureLoaded();
  return Object.fromEntries(memory);
}

export function clearRuntimeHealth(id?: string) {
  ensureLoaded();
  if (id) memory.delete(id);
  else memory.clear();
  persist();
}
