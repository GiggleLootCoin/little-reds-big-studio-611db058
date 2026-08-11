import { pipeline } from "@huggingface/transformers";

const CHAT_MODEL = "onnx-community/Qwen3-0.6B-ONNX";
const STT_MODEL = "onnx-community/whisper-tiny.en";

type ChatMessage = { role: string; content: string };
type TextGenerator = (messages: ChatMessage[], options?: Record<string, unknown>) => Promise<unknown>;
type Transcriber = (audio: Blob | ArrayBuffer | string, options?: Record<string, unknown>) => Promise<unknown>;

type Device = "webgpu" | "wasm";

let chatPromise: Promise<TextGenerator> | null = null;
let sttPromise: Promise<Transcriber> | null = null;

function hasWebGPU() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function hasWasm() {
  return typeof WebAssembly !== "undefined";
}

async function loadPipeline<T>(task: "text-generation" | "automatic-speech-recognition", model: string, attempts: Array<{ device: Device; dtype: string }>): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return (await pipeline(task, model, {
        device: attempt.device,
        dtype: attempt.dtype,
      })) as unknown as T;
    } catch (error) {
      lastError = error;
      // A phone can advertise WebGPU while the adapter/model initialization fails.
      // Move immediately to the next real local backend instead of leaving Buddy stuck.
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No working local AI backend could be initialized.");
}

async function loadChat(): Promise<TextGenerator> {
  if (!chatPromise) {
    const attempts: Array<{ device: Device; dtype: string }> = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q4f16" });
    if (hasWasm()) {
      attempts.push({ device: "wasm", dtype: "q8" });
      attempts.push({ device: "wasm", dtype: "q4" });
    }
    const promise = loadPipeline<TextGenerator>("text-generation", CHAT_MODEL, attempts).catch((error) => {
      chatPromise = null;
      throw error;
    });
    chatPromise = promise;
  }
  return chatPromise;
}

async function loadSpeechToText(): Promise<Transcriber> {
  if (!sttPromise) {
    const attempts: Array<{ device: Device; dtype: string }> = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q8" });
    if (hasWasm()) {
      attempts.push({ device: "wasm", dtype: "q8" });
      attempts.push({ device: "wasm", dtype: "q4" });
    }
    const promise = loadPipeline<Transcriber>("automatic-speech-recognition", STT_MODEL, attempts).catch((error) => {
      sttPromise = null;
      throw error;
    });
    sttPromise = promise;
  }
  return sttPromise;
}

export function localAiCapabilities() {
  return {
    browser: typeof window !== "undefined",
    webgpu: hasWebGPU(),
    wasm: hasWasm(),
    localChat: hasWasm() || hasWebGPU(),
    localSpeechToText: hasWasm() || hasWebGPU(),
    localTextToSpeech: typeof window !== "undefined" && "speechSynthesis" in window,
  };
}

export async function runLocalChat(messages: ChatMessage[]) {
  const generator = await loadChat();
  try {
    return await generator(messages, {
      max_new_tokens: 220,
      temperature: 0.7,
      do_sample: true,
      return_full_text: false,
    });
  } catch (error) {
    chatPromise = null;
    throw error;
  }
}

export async function runLocalSpeechToText(audio: Blob) {
  const transcriber = await loadSpeechToText();
  try {
    return await transcriber(audio, { return_timestamps: false });
  } catch (error) {
    sttPromise = null;
    throw error;
  }
}

export function resetLocalAi() {
  chatPromise = null;
  sttPromise = null;
}
