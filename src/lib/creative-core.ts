export type CreativeMemoryKind =
  | "conversation"
  | "preference"
  | "decision"
  | "lesson"
  | "creative-dna"
  | "project"
  | "failure"
  | "relationship";

export interface CreativeMemory {
  id: string;
  userId: string;
  kind: CreativeMemoryKind;
  text: string;
  importance: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  projectId?: string;
  source?: string;
}

export interface CreativeAsset {
  id: string;
  projectId: string;
  kind: "audio" | "image" | "video" | "text" | "voice" | "character" | "other";
  name: string;
  url?: string;
  sourceAssetId?: string;
  version: number;
  createdAt: number;
  metadata: Record<string, unknown>;
}

export interface CreativeProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  assets: CreativeAsset[];
  tags: string[];
}

export interface CreativeDNA {
  userId: string;
  preferredGenres: string[];
  visualStyle: string[];
  lyricalThemes: string[];
  voicePreferences: string[];
  thingsToAvoid: string[];
  successfulPatterns: string[];
  failedPatterns: string[];
  updatedAt: number;
}

export interface GenerationAttempt {
  engineId: string;
  startedAt: number;
  completedAt?: number;
  success: boolean;
  qualityScore?: number;
  failure?: string;
}

export interface CreativeJob<T = unknown> {
  id: string;
  userId: string;
  projectId?: string;
  intent: string;
  state: "queued" | "running" | "checking" | "recovering" | "complete" | "failed" | "cancelled";
  attempts: GenerationAttempt[];
  result?: T;
  createdAt: number;
  updatedAt: number;
}

export const CREATIVE_CORE_RULES = Object.freeze([
  "Understand the user's outcome before choosing a tool.",
  "Prefer the simplest high-quality method that can accomplish the task.",
  "Never report success until a usable result has been validated.",
  "Resume from the last successful stage instead of restarting completed work.",
  "Remember failures and do not repeatedly choose known-bad routes.",
  "Keep provider and model changes invisible to ordinary users.",
  "Ask only questions that materially change the outcome.",
  "Protect user files and preserve original-quality masters.",
  "Keep creative identity and project relationships persistent.",
  "When evidence is uncertain, say so internally and verify before presenting a claim as fact.",
]);

export function newCreativeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function rankMemories(
  memories: CreativeMemory[],
  query: string,
  limit = 12,
): CreativeMemory[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const now = Date.now();
  return [...memories]
    .map((memory) => {
      const haystack = `${memory.text} ${memory.tags.join(" ")}`.toLowerCase();
      const lexical = terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
      const ageDays = Math.max(0, (now - memory.updatedAt) / 86_400_000);
      const recency = 1 / (1 + ageDays / 30);
      return { memory, score: lexical * 3 + memory.importance * 2 + recency };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ memory }) => memory);
}

export function createCreativeDNA(userId: string): CreativeDNA {
  return {
    userId,
    preferredGenres: [],
    visualStyle: [],
    lyricalThemes: [],
    voicePreferences: [],
    thingsToAvoid: [],
    successfulPatterns: [],
    failedPatterns: [],
    updatedAt: Date.now(),
  };
}
