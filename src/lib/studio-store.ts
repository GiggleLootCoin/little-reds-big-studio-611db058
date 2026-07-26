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
  qrange: { range: number; warmth: number; glue: number; ceiling: number };
};

let state: StudioState = {
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
  qrange: { range: 64, warmth: 58, glue: 72, ceiling: -0.3 },
};

const subscribers = new Set<() => void>();

export function setStudio(patch: Partial<StudioState>) {
  state = { ...state, ...patch };
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
