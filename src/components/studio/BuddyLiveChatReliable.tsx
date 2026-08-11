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
const KEY = "lrbgs-buddy-chat-v17";
const SILENCE_MS = 1100;
const SPEECH_RMS = 0.025;
const RECORD_MAX_MS = 15000;
const STT_TIMEOUT = 45000;
const CHAT_TIMEOUT = 10000;
const TTS_TIMEOUT = 45000;

function timeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => timer && clearTimeout(timer));
}
function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.reduceRight((found, item) => found || textOf(item), "");
  if (!value || typeof value !== "object") return "";
  const r = value as Record<string, unknown>;
  for (const key of ["generated_text", "text", "transcription", "transcript", "content", "value", "data"]) { const found = textOf(r[key]); if (found) return found; }
  return "";
}
function instantFallback(text: string) {
  const q = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(q)) return "Hey! I'm Buddy. I'm listening. What are we making?";
  if (q.includes("song") || q.includes("music")) return "Absolutely. Give me the idea, mood, lyrics or reference and we'll build it.";
  if (q.includes("video")) return "Let's make it visual. Give me the scene or image and I'll choose the strongest free route.";
  if (q.includes("voice")) return "I can work with a voice you own or have permission to use. Tell me what you want changed.";
  return "I heard you. Tell me what you want to make, change or figure out and I'll get to work.";
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const heardRef = useRef(false);
  const silenceRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopMonitor = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    maxTimerRef.current = null;
    if (audioContextRef.current) { void audioContextRef.current.close().catch(() => undefined); audioContextRef.current = null; }
  };

  const speak = async (text: string) => {
    if (muted) return;
    setStatus("Buddy is speaking…");
    try {
      const reference = await timeout(loadStoredBuddyVoice(), 4000, "voice load timeout");
      const clone = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const result = await timeout(runGradio(clone ? FREE_SPACE_IDS.voiceClone : FREE_SPACE_IDS.voicePreset, "", clone
        ? { ref_audio: reference, ref_text: "", target_text: text, language: "English", use_xvector_only: true, model_size: "1.7B" }
        : { text, language: "English", speaker: localStorage.getItem("lrbgs-buddy-voice-preset") || "Ryan", instruct: "Natural conversational delivery." }, setStatus), TTS_TIMEOUT, "voice engine timeout");
      const logical = clone ? "voiceClone" : "voicePreset";
      const url = freeArtifactUrl(result, lastSuccessfulFreeSpace(logical, "Qwen/Qwen3-TTS"));
      if (!url) throw new Error("No audio artifact returned");
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      await audioRef.current.play();
      return;
    } catch (error) {
      console.warn("Natural Buddy voice unavailable; using device speech", error);
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const send = async (forced?: string, speakReply = false) => {
    const text = (forced ?? input).trim();
    if (!text || busyRef.current) return;
    busyRef.current = true; setBusy(true); setStatus("Buddy is thinking…");
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next); setInput("");
    let reply = "";
    try {
      const memory = await timeout(memoryContext(text, 6), 3000, "memory timeout").catch(() => "");
      const context = memory ? [{ role: "assistant" as const, content: `Relevant memory:\n${memory}` }, ...next] : next;
      reply = textOf(await timeout(runLocalChat(context), CHAT_TIMEOUT, "local Buddy brain timeout")).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } catch (error) {
      console.warn("Local Buddy brain unavailable", error);
      reply = instantFallback(text);
    }
    if (!reply) reply = instantFallback(text);
    setMessages([...next, { role: "assistant" as const, content: reply }]);
    void rememberConversation(text, reply).catch(() => undefined);
    busyRef.current = false; setBusy(false); setStatus("Buddy is ready.");
    if (speakReply || liveRef.current) void speak(reply);
  };

  const transcribe = async (blob: Blob) => {
    setListening(false); setStatus("Buddy is understanding you…");
    try {
      let text = "";
      try { text = textOf(await timeout(runLocalSpeechToText(blob), STT_TIMEOUT, "local speech timeout")); } catch (error) { console.warn("Local STT unavailable", error); }
      if (!text) {
        const result = await timeout(runGradio(FREE_SPACE_IDS.speechToText, "", { audio: blob }, setStatus), STT_TIMEOUT, "speech engine timeout");
        text = textOf(result);
      }
      if (text) await send(text, true);
      else if (liveRef.current) { setStatus("I didn't catch that. Listening again…"); window.setTimeout(() => void startListening(), 250); }
    } catch (error) {
      console.warn("Speech recognition failed", error);
      if (liveRef.current) { setStatus("I didn't catch that. Listening again…"); window.setTimeout(() => void startListening(), 250); }
    }
  };

  const startListening = async () => {
    if (!liveRef.current || busyRef.current || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setStatus("This browser cannot record microphone audio."); return; }
    try {
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = mime ? new MediaRecorder(streamRef.current, { mimeType: mime }) : new MediaRecorder(streamRef.current);
      chunksRef.current = []; heardRef.current = false; silenceRef.current = null;
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        recorderRef.current = null; setListening(false); stopMonitor();
        const parts = chunksRef.current; chunksRef.current = [];
        if (liveRef.current && parts.length) void transcribe(new Blob(parts, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.onerror = () => { recorderRef.current = null; setListening(false); stopMonitor(); if (liveRef.current) window.setTimeout(() => void startListening(), 250); };
      recorderRef.current = recorder; recorder.start(250); setListening(true); setStatus("Listening…");
      maxTimerRef.current = setTimeout(() => { if (recorderRef.current === recorder) recorder.stop(); }, RECORD_MAX_MS);
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = new Ctor(); const source = context.createMediaStreamSource(streamRef.current); const analyser = context.createAnalyser(); analyser.fftSize = 2048; source.connect(analyser); audioContextRef.current = context;
      const data = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (recorderRef.current !== recorder || !liveRef.current) return;
        analyser.getByteTimeDomainData(data); let sum = 0; for (const sample of data) { const n = (sample - 128) / 128; sum += n * n; }
        const rms = Math.sqrt(sum / data.length); const now = performance.now();
        if (rms >= SPEECH_RMS) { heardRef.current = true; silenceRef.current = null; }
        else if (heardRef.current) { if (silenceRef.current === null) silenceRef.current = now; else if (now - silenceRef.current >= SILENCE_MS) { recorder.stop(); return; } }
        rafRef.current = requestAnimationFrame(monitor);
      };
      rafRef.current = requestAnimationFrame(monitor);
    } catch (error) {
      console.warn("Microphone start failed", error); setListening(false); setStatus("Microphone permission is required for Live Conversation.");
    }
  };

  const stopAll = () => {
    liveRef.current = false;
    try { if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop(); } catch { /* ignore */ }
    recorderRef.current = null; stopMonitor(); streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    audioRef.current?.pause(); window.speechSynthesis?.cancel(); setListening(false);
  };
  const toggle = () => {
    if (liveRef.current) { stopAll(); setLive(false); setStatus("Buddy is ready."); return; }
    liveRef.current = true; setLive(true); setStatus("Starting hands-free Live Conversation…"); void startListening();
  };

  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(saved)) setMessages(saved.slice(-30)); } catch { /* ignore */ } return () => stopAll(); }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); }, [messages]);

  return <Panel eyebrow="BUDDY • LIVE" title="Talk to Buddy" icon={<Sparkles className="size-5" />} defaultOpen>
    <div className="buddy-live-stage" data-live={live} data-listening={listening}><div className="buddy-live-pulse" /><div><strong>{live ? (listening ? "Buddy is listening" : "Buddy is with you") : "Buddy is ready"}</strong><span>{status}</span></div></div>
    <div className="mt-3 flex flex-wrap gap-2"><StudioButton onClick={toggle} aria-pressed={live}><Mic className="size-4" />{live ? "Live Conversation On" : "Start Hands-Free Conversation"}</StudioButton><button type="button" onClick={() => { setMuted((m) => !m); window.speechSynthesis?.cancel(); }} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/75">{muted ? <VolumeX className="mr-2 inline size-4" /> : <Volume2 className="mr-2 inline size-4" />}{muted ? "Muted" : "Sound On"}</button></div>
    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3" aria-live="polite">{messages.length === 0 ? <p className="text-sm text-white/45">Say hello or type a message. Buddy listens, transcribes, thinks and answers.</p> : messages.map((m, i) => <div key={`${m.role}-${i}`} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-8 bg-red-500/10 text-white/85" : "mr-8 bg-white/[.04] text-white/75"}`}><strong className="mr-2 text-xs uppercase tracking-wider text-red-300">{m.role === "user" ? "You" : "Buddy"}</strong>{m.content}</div>)}</div>
    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}><input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} placeholder="Talk or type to Buddy…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/50" /><StudioButton type="submit" disabled={busy || !input.trim()} aria-label="Send message">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</StudioButton></form>
    <p className="mt-2 text-[11px] text-white/30">Hands-free mode uses direct microphone recording on Android, with automatic silence detection and a 15-second safety limit per utterance.</p>
  </Panel>;
}
