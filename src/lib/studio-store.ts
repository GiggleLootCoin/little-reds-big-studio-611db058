import { useSyncExternalStore } from "react";

export type StudioState = {
  audioPath: string | null;
  audioUrl: string | null;
  audioName: string | null;
  referencePath: string | null;
  referenceUrl: string | null;
  direction: string;
  lyrics: string;
  storyboard: string;
  title: string;
  bpm: number;
  seats: string[];
  qrange: { range: number; warmth: number; glue: number; ceiling: number };
};

const KEY = "little-reds-studio-state";
const defaults: StudioState = {
  audioPath: null,
  audioUrl: null,
  audioName: null,
  referencePath: null,
  referenceUrl: null,
  direction: "",
  lyrics: "",
  storyboard: "",
  title: "",
  bpm: 120,
  seats: [],
  qrange: { range: 64, warmth: 58, glue: 72, ceiling: -0.3 },
};

function load(): StudioState {
  if (typeof window === "undefined") return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<StudioState>;
    return {
      ...defaults,
      ...saved,
      audioUrl: null,
      referenceUrl: null,
    };
  } catch {
    return defaults;
  }
}

let state = load();
const subscribers = new Set<() => void>();

function persist(next: StudioState) {
  if (typeof window === "undefined") return;
  const serializable = {
    ...next,
    audioUrl: null,
    referenceUrl: null,
  };
  localStorage.setItem(KEY, JSON.stringify(serializable));
}

export function setStudio(patch: Partial<StudioState>) {
  state = { ...state, ...patch };
  persist(state);
  subscribers.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

const snapshot = () => state;

export function useStudio() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
