import { pipeline } from "@huggingface/transformers";

const CHAT_MODEL = "onnx-community/Qwen3-0.6B-ONNX";
const STT_MODEL = "onnx-community/whisper-tiny.en";

type ChatMessage = { role: string; content: string };
type TextGenerator = (messages: ChatMessage[], options?: Record<string, unknown>) => Promise<unknown>;
type Transcriber = (audio: Blob | ArrayBuffer | string, options?: Record<string, unknown>) => Promise<unknown>;

let chatPromise: Promise<TextGenerator> | null = null;
let sttPromise: Promise<Transcriber> | null = null;

function hasWebGPU() {
  return typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

async function loadChat(): Promise<TextGenerator> {
  if (!chatPromise) {
    chatPromise = (async () => {
      if (hasWebGPU()) {
        try {
          return (await pipeline("text-generation", CHAT_MODEL, { device: "webgpu", dtype: "q4f16" })) as unknown as TextGenerator;
        } catch (webgpuError) {
          console.warn("Buddy WebGPU model unavailable; falling back to WASM", webgpuError);
        }
      }
      if (typeof WebAssembly !== "undefined") {
        return (await pipeline("text-generation", CHAT_MODEL, { device: "wasm", dtype: "q4" })) as unknown as TextGenerator;
      }
      throw new Error("No supported local inference runtime is available.");
    })().catch((error) => {
      chatPromise = null;
      throw error;
    });
  }
  return chatPromise;
}

async function loadSpeechToText(): Promise<Transcriber> {
  if (!sttPromise) {
    sttPromise = (async () => {
      if (hasWebGPU()) {
        try {
          return (await pipeline("automatic-speech-recognition", STT_MODEL, { device: "webgpu", dtype: "q8" })) as unknown as Transcriber;
        } catch (webgpuError) {
          console.warn("Buddy WebGPU speech model unavailable; falling back to WASM", webgpuError);
        }
      }
      if (typeof WebAssembly !== "undefined") {
        return (await pipeline("automatic-speech-recognition", STT_MODEL, { device: "wasm", dtype: "q8" })) as unknown as Transcriber;
      }
      throw new Error("No supported local speech runtime is available.");
    })().catch((error) => {
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
    wasm: typeof WebAssembly !== "undefined",
    localChat: typeof WebAssembly !== "undefined",
    localSpeechToText: typeof WebAssembly !== "undefined",
    localTextToSpeech: typeof window !== "undefined" && "speechSynthesis" in window,
  };
}

export async function runLocalChat(messages: ChatMessage[]) {
  const generator = await loadChat();
  try {
    return await generator(messages, { max_new_tokens: 220, temperature: 0.7, do_sample: true, return_full_text: false });
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
