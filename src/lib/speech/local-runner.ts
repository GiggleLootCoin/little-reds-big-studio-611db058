import type { VoiceEngine } from "./voice-engines";

export type LocalRunner = {
  id: string;
  baseUrl: string;
  engineIds: string[];
};

export const DEFAULT_LOCAL_RUNNERS: LocalRunner[] = [
  { id: "qwen-local", baseUrl: "http://127.0.0.1:8787", engineIds: ["qwen3-tts-0.6b-onnx", "qwen3-tts-1.7b"] },
  { id: "chatterbox-local", baseUrl: "http://127.0.0.1:8788", engineIds: ["chatterbox-multilingual-v3", "chatterbox-onnx"] },
  { id: "cosyvoice-local", baseUrl: "http://127.0.0.1:8789", engineIds: ["cosyvoice-3"] },
  { id: "f5-local", baseUrl: "http://127.0.0.1:8790", engineIds: ["f5-tts"] },
];

function isLoopback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost");
  } catch {
    return false;
  }
}

export async function probeLocalRunner(runner: LocalRunner, signal?: AbortSignal): Promise<boolean> {
  if (typeof window === "undefined" || !isLoopback(runner.baseUrl)) return false;
  try {
    const response = await fetch(`${runner.baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function synthesizeWithLocalRunner(
  runner: LocalRunner,
  engine: VoiceEngine,
  input: {
    text: string;
    language: string;
    referenceAudio?: Blob;
    referenceTranscript?: string;
  },
  signal?: AbortSignal,
): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("Local voice inference is browser-only.");
  if (!isLoopback(runner.baseUrl)) throw new Error("Only a loopback local runner is permitted.");
  if (!runner.engineIds.includes(engine.id)) throw new Error("This runner does not support the selected voice engine.");
  if (!input.text.trim()) throw new Error("There is no text to synthesize.");

  const form = new FormData();
  form.set("engine", engine.id);
  form.set("text", input.text);
  form.set("language", input.language);
  if (input.referenceAudio) form.set("reference_audio", input.referenceAudio, "reference.wav");
  if (input.referenceTranscript) form.set("reference_transcript", input.referenceTranscript);

  const response = await fetch(`${runner.baseUrl}/v1/speech`, {
    method: "POST",
    body: form,
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Local voice runner returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("audio/")) {
    throw new Error("Local voice runner did not return an audio file.");
  }

  return response.blob();
}
