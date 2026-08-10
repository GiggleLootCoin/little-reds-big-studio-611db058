export type BuddyMemoryKind = "conversation" | "preference" | "decision" | "lesson" | "project" | "creative-dna";

export type BuddyMemory = {
  id: string;
  kind: BuddyMemoryKind;
  text: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  importance: number;
};

const DB_NAME = "lrbgs-buddy-memory";
const STORE = "memories";
const VERSION = 1;
const MAX_LOCAL_FALLBACK = 4000;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter((word) => word.length > 2);
}
function tagsFor(text: string) { return [...new Set(normalize(text).slice(0, 32))]; }
function browserStorageKey() {
  const identity = typeof localStorage !== "undefined" ? localStorage.getItem("lrbgs-user-id") : null;
  return `lrbgs-buddy-memory:${identity || "local-user"}`;
}
function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("importance", "importance");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}
async function allIndexed(): Promise<BuddyMemory[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as BuddyMemory[]) || []);
    request.onerror = () => resolve([]);
  });
}
function allFallback(): BuddyMemory[] {
  try { const raw = localStorage.getItem(browserStorageKey()); return raw ? JSON.parse(raw) as BuddyMemory[] : []; } catch { return []; }
}
async function putIndexed(memory: BuddyMemory) {
  const db = await openDb();
  if (!db) return false;
  return new Promise<boolean>((resolve) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(memory);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}
function putFallback(memory: BuddyMemory) {
  try { localStorage.setItem(browserStorageKey(), JSON.stringify([...allFallback(), memory].slice(-MAX_LOCAL_FALLBACK))); } catch { /* optional storage */ }
}
export async function remember(text: string, kind: BuddyMemoryKind = "conversation", importance = 0.5) {
  const clean = text.trim();
  if (!clean) return;
  const now = Date.now();
  const memory: BuddyMemory = { id: `${now}-${Math.random().toString(36).slice(2, 10)}`, kind, text: clean, createdAt: now, updatedAt: now, tags: tagsFor(clean), importance: Math.max(0, Math.min(1, importance)) };
  if (!(await putIndexed(memory))) putFallback(memory);
}
export async function recall(query: string, limit = 8): Promise<BuddyMemory[]> {
  const indexed = await allIndexed();
  const source = indexed.length ? indexed : allFallback();
  const queryTags = new Set(normalize(query));
  return source.map((memory) => {
    const overlap = memory.tags.reduce((score, tag) => score + (queryTags.has(tag) ? 1 : 0), 0);
    const ageDays = Math.max(0, (Date.now() - memory.updatedAt) / 86_400_000);
    const recency = 1 / (1 + ageDays / 30);
    return { memory, score: overlap * 3 + memory.importance * 2 + recency };
  }).sort((a, b) => b.score - a.score).slice(0, limit).map(({ memory }) => memory);
}
export async function rememberConversation(userText: string, assistantText: string) { await remember(`User: ${userText}\nBuddy: ${assistantText}`, "conversation", 0.45); }
export async function rememberPreference(text: string) { await remember(text, "preference", 0.9); }
export async function rememberLesson(text: string) { await remember(text, "lesson", 0.85); }
export async function memoryContext(query: string, limit = 8) { return (await recall(query, limit)).map((memory) => `[${memory.kind}] ${memory.text}`).join("\n"); }
export async function exportBuddyMemory() { const indexed = await allIndexed(); const source = indexed.length ? indexed : allFallback(); return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), memories: source }, null, 2); }
