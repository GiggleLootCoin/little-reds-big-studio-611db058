export type LocalBuddyClone = {
  id: string;
  name: string;
  language: string;
  modelUrl: string;
  sampleRate?: number;
};

const STORAGE_KEY = "little-reds-buddy-local-clone";

export function getLocalBuddyClone(): LocalBuddyClone | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalBuddyClone) : null;
  } catch {
    return null;
  }
}

export function setLocalBuddyClone(clone: LocalBuddyClone): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
}

export function clearLocalBuddyClone(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasLocalBuddyClone(): boolean {
  return getLocalBuddyClone() !== null;
}

export async function loadLocalBuddyClone(file: File, name = "Buddy — My Local Clone"): Promise<LocalBuddyClone> {
  const allowed = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg", "audio/webm"];
  if (!allowed.includes(file.type)) {
    throw new Error("Choose a WAV, MP3, OGG, or WebM voice-model package/sample.");
  }

  const objectUrl = URL.createObjectURL(file);
  const clone: LocalBuddyClone = {
    id: `buddy-local-${crypto.randomUUID()}`,
    name,
    language: "English",
    modelUrl: objectUrl,
  };
  setLocalBuddyClone(clone);
  return clone;
}
