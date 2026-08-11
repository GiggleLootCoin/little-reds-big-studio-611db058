import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { FREE_SPACE_IDS, runGradio } from "@/lib/gradio-free";
import { freeArtifactUrl } from "@/lib/free-artifact";
import { lastSuccessfulFreeSpace } from "@/lib/free-artifact-route";
import { memoryContext, rememberConversation } from "@/lib/buddy-memory";
import { runLocalChat, runLocalSpeechToText } from "@/lib/local-ai";
import { loadStoredBuddyVoice } from "./VoiceLabPanel";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;
const KEY = "lrbgs-buddy-chat-v18";
const STT_TIMEOUT = 30000;
const CHAT_TIMEOUT = 10000;
const TTS_TIMEOUT = 45000;
function timeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => timer && clearTimeout(timer));
}
function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.reduceRight((found, item) => found || textOf(item), "");
  if (!value || typeof value !== "object") return "";
  const r = value as Record<string, unknown>;
  for (const key of [
    "generated_text",
    "text",
    "transcription",
    "transcript",
    "content",
    "value",
    "data",
  ]) {
    const found = textOf(r[key]);
    if (found) return found;
  }
  return "";
}
function fallback(text: string) {
  const q = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(q)) return "Hey! I'm Buddy. I'm listening. What are we making?";
  if (q.includes("song") || q.includes("music"))
    return "Absolutely. Give me the idea, mood, lyrics or reference and we'll build it.";
  if (q.includes("video"))
    return "Let's make it visual. Give me the scene or image and I'll choose the strongest free route.";
  if (q.includes("voice"))
    return "I can work with a voice you own or have permission to use. Tell me what you want changed.";
  return "I heard you. Tell me what you want to make, change or figure out and I'll get to work.";
}
function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
export function BuddyLiveChatReliable() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Buddy is ready.");
  const liveRef = useRef(false);
  const busyRef = useRef(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const fallbackRecordingRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speak = async (text: string) => {
    if (muted) return;
    try {
      const reference = await timeout(loadStoredBuddyVoice(), 2500, "voice load timeout");
      const clone = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const result = await timeout(
        runGradio(
          clone ? FREE_SPACE_IDS.voiceClone : FREE_SPACE_IDS.voicePreset,
          "",
          clone
            ? {
                ref_audio: reference,
                ref_text: "",
                target_text: text,
                language: "English",
                use_xvector_only: true,
                model_size: "1.7B",
              }
            : {
                text,
                language: "English",
                speaker: localStorage.getItem("lrbgs-buddy-voice-preset") || "Ryan",
                instruct: "Natural conversational delivery.",
              },
          setStatus,
        ),
        TTS_TIMEOUT,
        "voice engine timeout",
      );
      const logical = clone ? "voiceClone" : "voicePreset";
      const url = freeArtifactUrl(result, lastSuccessfulFreeSpace(logical, "Qwen/Qwen3-TTS"));
      if (url) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        await audioRef.current.play().catch((error) => {
          throw error instanceof Error ? error : new Error('voice playback failed');
        });
        return;
      }
      throw new Error('voice provider returned no playable artifact');
    } catch {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.96;
        window.speechSynthesis.speak(u);
      }
    }
  };
  const send = async (forced?: string, speakReply = false) => {
    const text = (forced ?? input).trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStatus("Buddy is thinking…");
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next);
    setInput("");
    let reply = "";
    try {
      const memory = await timeout(memoryContext(text, 6), 2000, "memory timeout").catch(() => "");
      const context = memory
        ? [{ role: "assistant" as const, content: `Relevant memory:\n${memory}` }, ...next]
        : next;
      reply = textOf(
        await timeout(runLocalChat(context), CHAT_TIMEOUT, "local Buddy brain timeout"),
      )
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
    } catch {
      reply = fallback(text);
    }
    if (!reply) reply = fallback(text);
    setMessages([...next, { role: "assistant", content: reply }]);
    void rememberConversation(text, reply).catch(() => undefined);
    busyRef.current = false;
    setBusy(false);
    setStatus("Buddy is ready.");
    if (speakReply || liveRef.current) void speak(reply);
  };
  const stopFallbackRecorder = () => {
    try {
      if (fallbackRecordingRef.current?.state !== "inactive") fallbackRecordingRef.current?.stop();
    } catch {
      /* ignore */
    }
    fallbackRecordingRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false);
  };
  const startFallbackRecorder = async () => {
    if (!liveRef.current || busyRef.current || fallbackRecordingRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("This browser does not provide microphone recording.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mime
        ? new MediaRecorder(streamRef.current, { mimeType: mime })
        : new MediaRecorder(streamRef.current);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        fallbackRecordingRef.current = null;
        void (async () => {
          setListening(false);
          setStatus("Buddy is understanding you…");
          try {
            const result = await timeout(
              runLocalSpeechToText(blob),
              STT_TIMEOUT,
              "speech recognition timed out",
            );
            const text = textOf(result);
            if (text) await send(text, true);
            else setStatus("I didn't catch that. Listening again…");
          } catch {
            setStatus("Speech recognition failed. Listening again…");
          }
          if (liveRef.current && !busyRef.current)
            window.setTimeout(() => void startFallbackRecorder(), 300);
        })();
      };
      fallbackRecordingRef.current = recorder;
      recorder.start();
      setListening(true);
      setStatus("Listening… speak naturally, then pause.");
      window.setTimeout(() => {
        if (fallbackRecordingRef.current === recorder) recorder.stop();
      }, 12000);
    } catch {
      setStatus("Microphone permission is required for Live Conversation.");
      setListening(false);
    }
  };
  const startBrowserRecognition = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return false;
    try {
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setListening(true);
        setStatus("Listening…");
      };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        setListening(false);
        if (transcript) void send(transcript, true);
      };
      recognition.onerror = () => {
        setListening(false);
        recognitionRef.current = null;
        if (liveRef.current && !busyRef.current) void startFallbackRecorder();
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
        if (liveRef.current && !busyRef.current)
          window.setTimeout(() => {
            if (!startBrowserRecognition()) void startFallbackRecorder();
          }, 250);
      };
      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      return false;
    }
  };
  const stopAll = () => {
    liveRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    stopFallbackRecorder();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setListening(false);
  };
  const toggle = () => {
    if (liveRef.current) {
      stopAll();
      setLive(false);
      setStatus("Buddy is ready.");
      return;
    }
    liveRef.current = true;
    setLive(true);
    setStatus("Starting hands-free Live Conversation…");
    if (!startBrowserRecognition()) void startFallbackRecorder();
  };
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved.slice(-30));
    } catch {
      /* ignore */
    }
    return () => stopAll();
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
  }, [messages]);
  return (
    <Panel
      eyebrow="BUDDY • LIVE"
      title="Talk to Buddy"
      icon={<Sparkles className="size-5" />}
      defaultOpen
    >
      <div className="buddy-live-stage" data-live={live} data-listening={listening}>
        <div className="buddy-live-pulse" />
        <div>
          <strong>
            {live ? (listening ? "Buddy is listening" : "Buddy is with you") : "Buddy is ready"}
          </strong>
          <span>{status}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StudioButton onClick={toggle} aria-pressed={live}>
          <Mic className="size-4" />
          {live ? "Live Conversation On" : "Start Hands-Free Conversation"}
        </StudioButton>
        <button
          type="button"
          onClick={() => {
            setMuted((m) => !m);
            window.speechSynthesis?.cancel();
          }}
          className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/75"
        >
          {muted ? (
            <VolumeX className="mr-2 inline size-4" />
          ) : (
            <Volume2 className="mr-2 inline size-4" />
          )}
          {muted ? "Muted" : "Sound On"}
        </button>
      </div>
      <div
        className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-white/45">
            Say hello or type a message. Buddy listens, transcribes, thinks and answers.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-8 bg-red-500/10 text-white/85" : "mr-8 bg-white/[.04] text-white/75"}`}
            >
              <strong className="mr-2 text-xs uppercase tracking-wider text-red-300">
                {m.role === "user" ? "You" : "Buddy"}
              </strong>
              {m.content}
            </div>
          ))
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Talk or type to Buddy…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/50"
        />
        <StudioButton type="submit" disabled={busy || !input.trim()} aria-label="Send message">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        </StudioButton>
      </form>
      <p className="mt-2 text-[11px] text-white/30">
        Hands-free uses browser speech recognition when available, with real audio-recording and
        local Whisper fallback. Buddy uses the selected free voice first and only falls back to the
        device voice when a real playable voice artifact cannot be produced.
      </p>
    </Panel>
  );
}
