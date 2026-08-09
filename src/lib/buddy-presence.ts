export type BuddyStatus = "idle" | "listening" | "thinking" | "working" | "success" | "error";

export type BuddyStatusSnapshot = {
  status: BuddyStatus;
  task: string | null;
  message: string | null;
};

const DEFAULT_STATUS: BuddyStatusSnapshot = {
  status: "idle",
  task: null,
  message: null,
};

let snapshot: BuddyStatusSnapshot = DEFAULT_STATUS;
const listeners = new Set<() => void>();

export function getBuddyStatus(): BuddyStatusSnapshot {
  return snapshot;
}

export function setBuddyStatus(
  status: BuddyStatus,
  patch: Partial<Omit<BuddyStatusSnapshot, "status">> = {},
) {
  snapshot = { ...snapshot, status, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeBuddyStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetBuddyStatus() {
  snapshot = DEFAULT_STATUS;
  listeners.forEach((listener) => listener());
}
