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
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

const KEY = "lrbgs-buddy-chat-production-v1";
const STT_TIMEOUT = 60000;
const CHAT_TIMEOUT = 150000;
const TTS_TIMEOUT = 90000;

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
  if (Array.isArray(value)) return value.map(textOf).find(Boolean) || "";
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["generated_text", "text", "transcription", "transcript", "content", "value", "data"]) {
    const found = textOf(record[key]);
    if (found) return found;
  }
  return "";
}

function fallback(text: string) {
  return `I couldn't reach Buddy's AI engine just now. I heard: “${text}”. Please try that again in a moment.`;
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function BuddyLiveChatProduction() {
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);

  const restartListening = () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recognitionRef.current || recorderRef.current) return;
    window.setTimeout(() => {
      if (!liveRef.current || busyRef.current || speakingRef.current || recognitionRef.current || recorderRef.current) return;
      if (!startBrowserRecognition()) void startRecorder();
    }, 350);
  };

  const speak = async (text: string) => {
    if (muted || speakingRef.current) return;
    speakingRef.current = true;
    try {
      const reference = await timeout(loadStoredBuddyVoice(), 2500, "voice preference timeout");
      const clone = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const logical = clone ? FREE_SPACE_IDS.voiceClone : FREE_SPACE_IDS.voicePreset;
      const result = await timeout(
        runGradio(
          logical,
          "",
          clone
            ? { ref_audio: reference, ref_text: "", target_text: text, language: "English", use_xvector_only: true, model_size: "1.7B" }
            : { text, language: "English", speaker: localStorage.getItem("lrbgs-buddy-voice-preset") || "Ryan", instruct: "Natural, warm, conversational delivery. Speak like a real creative partner, with varied pacing and pauses." },
          setStatus,
        ),
        TTS_TIMEOUT,
        "natural Buddy voice timed out",
      );
      const url = freeArtifactUrl(result, lastSuccessfulFreeSpace(logical, "Qwen/Qwen3-TTS"));
      if (!url) throw new Error("No usable natural voice artifact returned.");
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.onended = () => {
        speakingRef.current = false;
        restartListening();
      };
      await audioRef.current.play();
      return;
    } catch {
      // Natural voice is preferred. Device speech is the final no-key fallback.
    }
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.98;
          utterance.pitch = 1.02;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
    } finally {
      speakingRef.current = false;
      restartListening();
    }
  };

  const answer = async (text: string, speakReply: boolean) => {
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStatus("Buddy is thinking…");
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next);
    setInput("");
    try {
      const memory = await timeout(memoryContext(text, 6), 2500, "memory timeout").catch(() => "");
      const context = memory
        ? [{ role: "assistant" as const, content: `Relevant memory:\n${memory}` }, ...next]
        : next;
      let reply = "";
      try {
        reply = textOf(await timeout(runLocalChat(context), CHAT_TIMEOUT, "Buddy AI timed out"))
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();
      } catch {
        reply = "";
      }
      if (!reply) reply = fallback(text);
      setMessages([...next, { role: "assistant", content: reply }]);
      void rememberConversation(text, reply).catch(() => undefined);
      setStatus("Buddy is ready.");
      if (speakReply || liveRef.current) void speak(reply);
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (!liveRef.current) setStatus("Buddy is ready.");
      if (liveRef.current && !speakingRef.current) restartListening();
    }
  };

  const stopRecorder = () => {
    try { recorderRef.current?.stop(); } catch { /* already stopped */ }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false);
  };

  const startRecorder = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("This browser does not provide microphone recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        recorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setListening(false);
        void (async () => {
          setStatus("Buddy is understanding you…");
          try {
            let text = "";
            try { text = textOf(await timeout(runLocalSpeechToText(blob), STT_TIMEOUT, "local Whisper timed out")); } catch { /* remote below */ }
            if (!text) text = textOf(await timeout(runGradio("speechToText", "", { audio: blob }, setStatus), STT_TIMEOUT, "free speech recognition timed out"));
            if (!text) throw new Error("I didn't catch that. Try speaking again.");
            await answer(text, true);
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Speech recognition failed. Try again.");
          }
          restartListening();
        })();
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setListening(true);
      setStatus("Listening… speak naturally, then pause.");
      window.setTimeout(() => { if (recorderRef.current === recorder) recorder.stop(); }, 10000);
    } catch {
      setListening(false);
      setStatus("Microphone permission is required for Live Conversation.");
    }
  };

  function startBrowserRecognition() {
    const Ctor = recognitionCtor();
    if (!Ctor || speakingRef.current) return false;
    try {
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setListening(true); setStatus("Listening…"); };
      recognition.onresult = (event) => {
        recognitionRef.current = null;
        setListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) void answer(transcript, true);
      };
      recognition.onerror = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current) void startRecorder(); };
      recognition.onend = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current && !speakingRef.current) restartListening(); };
      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      return false;
    }
  }

  const stopAll = () => {
    liveRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
    stopRecorder();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
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
    setStatus("Starting Live Conversation…");
    if (!startBrowserRecognition()) void startRecorder();
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved.slice(-30));
    } catch { /* ignore invalid history */ }
    return () => stopAll();
  }, []);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); }, [messages]);

  return (
    <Panel eyebrow="BUDDY • LIVE" title="Talk to Buddy" icon={<Sparkles className="size-5" />} defaultOpen>
      <div className="buddy-live-stage" data-live={live} data-listening={listening}>
        <div className="buddy-live-pulse" />
        <div><strong>{live ? (listening ? "Buddy is listening" : "Buddy is with you") : "Buddy is ready"}</strong><span>{status}</span></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StudioButton onClick={toggle} aria-pressed={live}><Mic className="size-4" />{live ? "Live Conversation On" : "Start Hands-Free Conversation"}</StudioButton>
        <button type="button" onClick={() => { setMuted((value) => !value); window.speechSynthesis?.cancel(); }} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/75">
          {muted ? <VolumeX className="mr-2 inline size-4" /> : <Volume2 className="mr-2 inline size-4" />}{muted ? "Muted" : "Natural Voice On"}
        </button>
      </div>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3" aria-live="polite">
        {messages.length === 0 ? <p className="text-sm text-white/45">Say hello or type a message. Buddy will use the real free AI brain first and only fall back locally if every public route is unavailable.</p> : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-xl p-3 text-sm ${message.role === "user" ? "ml-8 bg-red-500/10 text-white/85" : "mr-8 bg-white/[.04] text-white/75"}`}><strong className="mr-2 text-xs uppercase tracking-wider text-red-300">{message.role === "user" ? "You" : "Buddy"}</strong>{message.content}</div>)}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void answer(input.trim(), true); }}>
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Talk or type to Buddy…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/50" />
        <StudioButton type="submit" disabled={busy || !input.trim()} aria-label="Send message">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</StudioButton>
      </form>
    </Panel>
  );
}
