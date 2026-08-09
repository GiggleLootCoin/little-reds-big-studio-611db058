export type LocalBuddyClone = {
  id: string;
  name: string;
  language: string;
  modelUrl?: string;
  sampleUrl?: string;
  modelFormat?: "onnx" | "webgpu" | "wasm" | "unknown";
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
  const clone = getLocalBuddyClone();
  if (clone?.modelUrl?.startsWith("blob:")) URL.revokeObjectURL(clone.modelUrl);
  if (clone?.sampleUrl?.startsWith("blob:")) URL.revokeObjectURL(clone.sampleUrl);
  localStorage.removeItem(STORAGE_KEY);
}

export function hasLocalBuddyClone(): boolean {
  return getLocalBuddyClone() !== null;
}

export function isUsableLocalClone(clone = getLocalBuddyClone()): clone is LocalBuddyClone & { modelUrl: string } {
  return Boolean(clone?.modelUrl && clone.modelUrl.length > 0);
}

export async function loadLocalBuddyClone(file: File, name = "Buddy — My Local Clone"): Promise<LocalBuddyClone> {
  const modelFormats = new Map<string, LocalBuddyClone["modelFormat"]>([
    ["application/onnx", "onnx"],
    ["model/onnx", "onnx"],
    ["application/octet-stream", "unknown"],
  ]);

  const isModel = file.name.toLowerCase().endsWith(".onnx") || modelFormats.has(file.type);
  const isAudio = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg", "audio/webm", "audio/mp4"].includes(file.type);

  if (!isModel && !isAudio) {
    throw new Error("Choose an ONNX local voice model or a WAV, MP3, OGG, WebM, or M4A reference recording.");
  }

  const previous = getLocalBuddyClone();
  if (previous?.modelUrl?.startsWith("blob:")) URL.revokeObjectURL(previous.modelUrl);
  if (previous?.sampleUrl?.startsWith("blob:")) URL.revokeObjectURL(previous.sampleUrl);

  const objectUrl = URL.createObjectURL(file);
  const clone: LocalBuddyClone = isModel
    ? {
        id: `buddy-local-${crypto.randomUUID()}`,
        name,
        language: "English",
        modelUrl: objectUrl,
        modelFormat: modelFormats.get(file.type) ?? (file.name.toLowerCase().endsWith(".onnx") ? "onnx" : "unknown"),
      }
    : {
        id: `buddy-reference-${crypto.randomUUID()}`,
        name,
        language: "English",
        sampleUrl: objectUrl,
      };

  setLocalBuddyClone(clone);
  return clone;
}
