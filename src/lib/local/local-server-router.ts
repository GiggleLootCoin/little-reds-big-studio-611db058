export type LocalServerKind = "llama.cpp" | "ollama" | "localai" | "vllm";

export type LocalServer = {
  id: LocalServerKind;
  name: string;
  defaultBaseUrl: string;
  openSource: true;
  apiKeyRequired: false;
};

export const LOCAL_SERVERS: LocalServer[] = [
  { id: "llama.cpp", name: "llama.cpp", defaultBaseUrl: "http://127.0.0.1:8080", openSource: true, apiKeyRequired: false },
  { id: "ollama", name: "Ollama", defaultBaseUrl: "http://127.0.0.1:11434", openSource: true, apiKeyRequired: false },
  { id: "localai", name: "LocalAI", defaultBaseUrl: "http://127.0.0.1:8080", openSource: true, apiKeyRequired: false },
  { id: "vllm", name: "vLLM", defaultBaseUrl: "http://127.0.0.1:8000", openSource: true, apiKeyRequired: false },
];

function isLoopback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]" || parsed.hostname === "::1";
  } catch {
    return false;
  }
}

export async function probeLocalServer(server: LocalServer, baseUrl = server.defaultBaseUrl): Promise<boolean> {
  if (typeof fetch === "undefined" || !isLoopback(baseUrl)) return false;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, { method: "GET", signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function findAvailableLocalServer(): Promise<LocalServer | null> {
  for (const server of LOCAL_SERVERS) {
    if (await probeLocalServer(server)) return server;
  }
  return null;
}
