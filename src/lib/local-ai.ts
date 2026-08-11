import { pipeline } from "@huggingface/transformers";

// Android-first: the previous Qwen3 0.6B browser model is hundreds of MB and
// can exhaust memory before inference begins. SmolLM2-135M-Instruct has a
// much smaller quantized ONNX footprint and is explicitly Transformers.js-ready.
const CHAT_MODEL = "onnx-community/SmolLM2-135M-Instruct-ONNX";
const STT_MODEL = "onnx-community/whisper-tiny.en";

type ChatMessage = { role: string; content: string };
type TextGenerator = (messages: ChatMessage[], options?: Record<string, unknown>) => Promise<unknown>;
type Transcriber = (audio: Blob | ArrayBuffer | string, options?: Record<string, unknown>) => Promise<unknown>;
type Device = "webgpu" | "wasm";
type DType = "auto" | "fp32" | "fp16" | "q8" | "int8" | "uint8" | "q4" | "bnb4" | "q4f16" | "q2" | "q2f16" | "q1" | "q1f16";
type PipelineAttempt = { device: Device; dtype: DType };

let chatPromise: Promise<TextGenerator> | null = null;
let sttPromise: Promise<Transcriber> | null = null;

function hasWebGPU() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function hasWasm() {
  return typeof WebAssembly !== "undefined";
}

async function loadPipeline<T>(task: "text-generation" | "automatic-speech-recognition", model: string, attempts: PipelineAttempt[]): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return (await pipeline(task, model, { device: attempt.device, dtype: attempt.dtype })) as unknown as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No working local AI backend could be initialized.");
}

async function loadChat(): Promise<TextGenerator> {
  if (!chatPromise) {
    const attempts: PipelineAttempt[] = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q4f16" });
    if (hasWasm()) {
      attempts.push({ device: "wasm", dtype: "q4" });
      attempts.push({ device: "wasm", dtype: "q8" });
    }
    chatPromise = loadPipeline<TextGenerator>("text-generation", CHAT_MODEL, attempts).catch((error) => {
      chatPromise = null;
      throw error;
    });
  }
  return chatPromise;
}

async function loadSpeechToText(): Promise<Transcriber> {
  if (!sttPromise) {
    const attempts: PipelineAttempt[] = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q8" });
    if (hasWasm()) {
      attempts.push({ device: "wasm", dtype: "q4" });
      attempts.push({ device: "wasm", dtype: "q8" });
    }
    sttPromise = loadPipeline<Transcriber>("automatic-speech-recognition", STT_MODEL, attempts).catch((error) => {
      sttPromise = null;
      throw error;
    });
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
      max_new_tokens: 160,
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
