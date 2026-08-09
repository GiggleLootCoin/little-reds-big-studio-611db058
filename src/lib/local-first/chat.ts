export type LocalChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "little-reds-local-chat";

export function loadLocalChat(): LocalChatMessage[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((message): message is LocalChatMessage => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        (candidate.role === "user" ||
          candidate.role === "assistant" ||
          candidate.role === "system") &&
        typeof candidate.content === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function appendLocalChat(
  message: Omit<LocalChatMessage, "id" | "createdAt">,
): LocalChatMessage[] {
  const next: LocalChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const history = [...loadLocalChat(), next];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearLocalChat(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function localChatHasNoProviderDependency(): true {
  return true;
}
