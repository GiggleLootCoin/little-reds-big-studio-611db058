import { pipeline } from "@huggingface/transformers";

const CHAT_MODEL = "onnx-community/Qwen3-0.6B-ONNX";
const STT_MODEL = "onnx-community/whisper-tiny.en";

type ChatMessage = { role: string; content: string };
type TextGenerator = (messages: ChatMessage[], options?: Record<string, unknown>) => Promise<unknown>;
type Transcriber = (audio: Blob | ArrayBuffer | string, options?: Record<string, unknown>) => Promise<unknown>;

let chatPromise: Promise<TextGenerator> | null = null;
let sttPromise: Promise<Transcriber> | null = null;

function hasWebGPU() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function hasWasm() {
  return typeof WebAssembly !== "undefined";
}

async function loadChat(): Promise<TextGenerator> {
  if (!chatPromise) {
    chatPromise = pipeline("text-generation", CHAT_MODEL, {
      device: hasWebGPU() ? "webgpu" : "wasm",
      dtype: hasWebGPU() ? "q4f16" : "q4",
    }) as Promise<unknown> as Promise<TextGenerator>;
  }
  return chatPromise;
}

async function loadSpeechToText(): Promise<Transcriber> {
  if (!sttPromise) {
    sttPromise = pipeline("automatic-speech-recognition", STT_MODEL, {
      device: hasWebGPU() ? "webgpu" : "wasm",
      dtype: "q8",
    }) as Promise<unknown> as Promise<Transcriber>;
  }
  return sttPromise;
}

export function localAiCapabilities() {
  return {
    browser: typeof window !== "undefined",
    webgpu: hasWebGPU(),
    wasm: hasWasm(),
    localChat: hasWasm(),
    localSpeechToText: hasWasm(),
    localTextToSpeech: typeof window !== "undefined" && "speechSynthesis" in window,
  };
}

export async function runLocalChat(messages: ChatMessage[]) {
  const generator = await loadChat();
  return generator(messages, {
    max_new_tokens: 220,
    temperature: 0.7,
    do_sample: true,
    return_full_text: false,
  });
}

export async function runLocalSpeechToText(audio: Blob) {
  const transcriber = await loadSpeechToText();
  return transcriber(audio, { return_timestamps: false });
}

export function resetLocalAi() {
  chatPromise = null;
  sttPromise = null;
}
