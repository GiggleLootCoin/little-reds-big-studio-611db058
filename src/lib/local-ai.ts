import { pipeline } from "@huggingface/transformers";
import { runGradio } from "@/lib/gradio-free";

// Android-first local fallbacks. Remote free inference is preferred for Buddy
// conversation because tiny on-device models are useful as a fallback, not as
// a convincing conversational brain.
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

function hasWebGPU() { return typeof navigator !== "undefined" && "gpu" in navigator; }
function hasWasm() { return typeof WebAssembly !== "undefined"; }

async function loadPipeline<T>(task: "text-generation" | "automatic-speech-recognition", model: string, attempts: PipelineAttempt[]): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return (await pipeline(task, model, { device: attempt.device, dtype: attempt.dtype })) as unknown as T;
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error("No working local AI backend could be initialized.");
}

async function loadChat(): Promise<TextGenerator> {
  if (!chatPromise) {
    const attempts: PipelineAttempt[] = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q4f16" });
    if (hasWasm()) { attempts.push({ device: "wasm", dtype: "q4" }); attempts.push({ device: "wasm", dtype: "q8" }); }
    chatPromise = loadPipeline<TextGenerator>("text-generation", CHAT_MODEL, attempts).catch((error) => { chatPromise = null; throw error; });
  }
  return chatPromise;
}

async function loadSpeechToText(): Promise<Transcriber> {
  if (!sttPromise) {
    const attempts: PipelineAttempt[] = [];
    if (hasWebGPU()) attempts.push({ device: "webgpu", dtype: "q8" });
    if (hasWasm()) { attempts.push({ device: "wasm", dtype: "q4" }); attempts.push({ device: "wasm", dtype: "q8" }); }
    sttPromise = loadPipeline<Transcriber>("automatic-speech-recognition", STT_MODEL, attempts).catch((error) => { sttPromise = null; throw error; });
  }
  return sttPromise;
}

function cleanRemoteReply(value: unknown): string {
  if (typeof value === "string") return value.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (Array.isArray(value)) return value.map(cleanRemoteReply).find(Boolean) || "";
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["generated_text", "text", "content", "message", "response", "answer", "data"]) {
    const found = cleanRemoteReply(record[key]);
    if (found) return found;
  }
  return "";
}

function usableRemoteReply(reply: string, userText: string) {
  const normalized = reply.replace(/\s+/g, " ").trim();
  if (normalized.length < 2 || normalized === userText.trim()) return false;
  const placeholder = /^(loading|processing|generating|thinking|please wait|starting|queued|running|done|success|hello[,!. ]*i'?m buddy|i'?m a demo|this is a demo)[.!… ]*$/i;
  if (placeholder.test(normalized)) return false;
  return true;
}

export function localAiCapabilities() {
  return { browser: typeof window !== "undefined", webgpu: hasWebGPU(), wasm: hasWasm(), localChat: hasWasm() || hasWebGPU(), localSpeechToText: hasWasm() || hasWebGPU(), localTextToSpeech: typeof window !== "undefined" && "speechSynthesis" in window };
}

/**
 * Buddy's conversational brain. Use a real public model first; only fall back
 * to the tiny on-device model when every free cloud route is unavailable.
 * This prevents the 135M demo model from being mistaken for Buddy's real brain.
 */
export async function runLocalChat(messages: ChatMessage[]) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content?.trim() || "";
  const history = messages.slice(-12);
  if (lastUser) {
    try {
      const remote = await runGradio("chat", "", {
        message: lastUser,
        prompt: lastUser,
        history,
        system_prompt: "You are Buddy, Little Red's creative studio partner. Be natural, specific, useful and conversational. Remember context. Help with music, lyrics, images, video, voice, production and creative decisions. Never claim you generated something unless an actual artifact exists. Do not sound like a canned demo.",
      });
      const reply = cleanRemoteReply(remote);
      if (usableRemoteReply(reply, lastUser)) return reply;
      throw new Error("Free chat route returned a placeholder response.");
    } catch {
      // Continue to the local fallback.
    }
  }

  const generator = await loadChat();
  try {
    return await generator([
      { role: "system", content: "You are Buddy, a natural and helpful creative studio assistant. Be concise, specific and conversational. Do not use canned greetings unless appropriate." },
      ...messages.slice(-10),
    ], { max_new_tokens: 220, temperature: 0.75, do_sample: true, return_full_text: false });
  } catch (error) {
    chatPromise = null;
    throw error;
  }
}

export async function runLocalSpeechToText(audio: Blob) {
  const transcriber = await loadSpeechToText();
  try { return await transcriber(audio, { return_timestamps: false }); }
  catch (error) { sttPromise = null; throw error; }
}

export function resetLocalAi() { chatPromise = null; sttPromise = null; }
