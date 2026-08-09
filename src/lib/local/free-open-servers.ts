export type LocalServerId = "llama-cpp" | "ollama" | "localai" | "vllm";

export type LocalOpenServer = {
  id: LocalServerId;
  name: string;
  endpoint: string;
  openSource: true;
  apiKeyRequired: false;
  accountRequired: false;
  paidServiceRequired: false;
  openaiCompatible: boolean;
  androidFriendly: "phone" | "termux" | "runner";
  bestFor: string[];
};

/**
 * Local/self-hosted endpoints only. These defaults never point at a paid cloud
 * provider. Users can override the localhost URL when running a local server.
 */
export const FREE_OPEN_LOCAL_SERVERS: LocalOpenServer[] = [
  {
    id: "llama-cpp",
    name: "llama.cpp server",
    endpoint: "http://127.0.0.1:8080",
    openSource: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidServiceRequired: false,
    openaiCompatible: true,
    androidFriendly: "termux",
    bestFor: ["GGUF", "CPU inference", "Vulkan", "lightweight local models"],
  },
  {
    id: "ollama",
    name: "Ollama",
    endpoint: "http://127.0.0.1:11434",
    openSource: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidServiceRequired: false,
    openaiCompatible: true,
    androidFriendly: "termux",
    bestFor: ["easy model management", "local chat", "tool calling"],
  },
  {
    id: "localai",
    name: "LocalAI",
    endpoint: "http://127.0.0.1:8080",
    openSource: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidServiceRequired: false,
    openaiCompatible: true,
    androidFriendly: "runner",
    bestFor: ["OpenAI-compatible local APIs", "multimodal pipelines", "self-hosting"],
  },
  {
    id: "vllm",
    name: "vLLM",
    endpoint: "http://127.0.0.1:8000",
    openSource: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidServiceRequired: false,
    openaiCompatible: true,
    androidFriendly: "runner",
    bestFor: ["high-throughput GPU inference", "batching", "multiple users"],
  },
];

export function getLocalServer(id: LocalServerId): LocalOpenServer {
  return FREE_OPEN_LOCAL_SERVERS.find((server) => server.id === id) ?? FREE_OPEN_LOCAL_SERVERS[0];
}

export function isAllowedLocalEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "http:" &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]");
  } catch {
    return false;
  }
}

export async function checkLocalServer(server: LocalOpenServer): Promise<boolean> {
  if (typeof fetch === "undefined" || !isAllowedLocalEndpoint(server.endpoint)) return false;
  try {
    const response = await fetch(server.endpoint, { method: "GET", signal: AbortSignal.timeout(2500) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}
