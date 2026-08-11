export type StudioTaskKind = "lyrics" | "music" | "image" | "video" | "voice" | "stems" | "chat";

export type ProjectSnapshot = {
  id: string;
  updatedAt: number;
  title?: string;
  task?: StudioTaskKind;
  metadata?: Record<string, unknown>;
};

export type JobAttempt<T> = () => Promise<T>;

const SNAPSHOT_KEY = "little-red-studio:project-snapshots:v1";
const MAX_SNAPSHOTS = 40;
const cooldowns = new Map<string, number>();

export function saveProjectSnapshot(snapshot: ProjectSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readProjectSnapshots().filter((item) => item.id !== snapshot.id);
    const next = [snapshot, ...existing]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
  } catch {
    // Recovery is best-effort and never blocks creative work.
  }
}

export function readProjectSnapshots(): ProjectSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function removeProjectSnapshot(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify(readProjectSnapshots().filter((item) => item.id !== id)),
    );
  } catch {
    /* best effort */
  }
}

export function shouldRetryRoute(route: string): boolean {
  return (cooldowns.get(route) ?? 0) <= Date.now();
}
export function coolDownRoute(route: string, failures = 1): void {
  const delay = Math.min(5 * 60_000, 2_000 * 2 ** Math.max(0, failures - 1));
  cooldowns.set(route, Date.now() + delay);
}
export function restoreRoute(route: string): void {
  cooldowns.delete(route);
}

export async function withRecovery<T>(
  route: string,
  attempts: JobAttempt<T>[],
  isUsable: (value: T) => boolean,
): Promise<T> {
  let lastError: unknown = new Error("No recovery route succeeded.");
  let failures = 0;
  for (const attempt of attempts) {
    if (!shouldRetryRoute(route)) continue;
    try {
      const result = await attempt();
      if (!isUsable(result)) throw new Error("The service returned an unusable result.");
      restoreRoute(route);
      return result;
    } catch (error) {
      lastError = error;
      failures += 1;
      coolDownRoute(route, failures);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All recovery routes failed.");
}

export function inferMediaKind(url: string): "audio" | "image" | "video" | "unknown" {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(mp3|wav|flac|m4a|ogg|aac)$/.test(clean)) return "audio";
  if (/\.(png|jpe?g|webp|gif|avif)$/.test(clean)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/.test(clean)) return "video";
  return "unknown";
}

export async function validateMediaOutput(
  url: string,
  expected: "audio" | "image" | "video",
): Promise<boolean> {
  if (!url || typeof window === "undefined") return false;
  const kind = inferMediaKind(url);
  if (kind === expected) return true;
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return false;
    const type = response.headers.get("content-type") ?? "";
    return expected === "audio"
      ? type.startsWith("audio/")
      : expected === "image"
        ? type.startsWith("image/")
        : type.startsWith("video/");
  } catch {
    return false;
  }
}

export function registerSafeDownload(url: string, filename: string): void {
  if (typeof window === "undefined") return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
