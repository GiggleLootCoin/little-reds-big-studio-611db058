import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { FREE_SPACE_IDS, runGradio } from "@/lib/gradio-free";
import { freeArtifactUrl } from "@/lib/free-artifact";
import { lastSuccessfulFreeSpace } from "@/lib/free-artifact-route";
import { memoryContext, rememberConversation } from "@/lib/buddy-memory";
import { liveWebSearch, shouldResearch } from "@/lib/buddy-web";
import { runLocalChat, runLocalSpeechToText } from "@/lib/local-ai";
import { loadStoredBuddyVoice } from "./VoiceLabPanel";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: { length: number; item(index: number): RecognitionResult } };
type RecognitionLike = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; abort: () => void; onresult: ((event: RecognitionEvent) => void) | null; onend: (() => void) | null; onerror: ((event?: unknown) => void) | null };
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };

const KEY = "lrbgs-buddy-chat-v16";
const VOICE_FALLBACK_SPACE = "Qwen/Qwen3-TTS";
const SILENCE_MS = 1100;
const SPEECH_RMS = 0.025;
const CHAT_TIMEOUT_MS = 20000;
const RESEARCH_TIMEOUT_MS = 15000;
const TTS_TIMEOUT_MS = 45000;
const STT_TIMEOUT_MS = 45000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => { if (timer) clearTimeout(timer); });
}
function extract(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.reduceRight((found, item) => found || extract(item), "");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["generated_text", "text", "transcription", "value", "content", "data"]) { const found = extract(record[key]); if (found) return found; }
  return "";
}
function fallback(text: string) {
  const query = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(query)) return "Hey! I'm Buddy. What are we making?";
  if (query.includes("song") || query.includes("music")) return "Absolutely. Give me the idea, mood or lyrics and I'll handle the complicated bits.";
  if (query.includes("lyric")) return "Give me the feeling, story or subject and I'll shape it into a complete song structure.";
  if (query.includes("video")) return "Let's make it visual. Give me an image or idea and I'll choose the strongest free video route.";
  if (query.includes("voice")) return "I can work with a voice you own or have permission to use. I'll handle the conversion behind the scenes.";
  return "I'm Buddy. Tell me what you want to make, change or figure out.";
}

export function BuddyLiveChatLite() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Buddy is ready.");
  const [researching, setResearching] = useState(false);
  const liveRef = useRef(false);
  const busyRef = useRef(false);
  const speakingRef = useRef(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const heardSpeechRef = useRef(false);
  const silenceSinceRef = useRef<number | null>(null);

  const stopRecognition = () => { try { recognitionRef.current?.abort(); } catch { /* already stopped */ } recognitionRef.current = null; };
  const stopMonitor = () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); rafRef.current = null; analyserRef.current = null; if (audioContextRef.current) { void audioContextRef.current.close().catch(() => undefined); audioContextRef.current = null; } };

  const speak = async (text: string) => {
    if (muted) { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); return; }
    speakingRef.current = true;
    stopRecognition();
    setListening(false);
    setStatus("Buddy is speaking…");
    try {
      const reference = await withTimeout(loadStoredBuddyVoice(), 5000, "Buddy voice loading timed out.");
      const cloneMode = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const result = cloneMode
        ? await withTimeout(runGradio(FREE_SPACE_IDS.voiceClone, "", { ref_audio: reference, ref_text: "", target_text: text, language: "English", use_xvector_only: true, model_size: "1.7B" }, setStatus), TTS_TIMEOUT_MS, "Buddy's voice service timed out.")
        : await withTimeout(runGradio(FREE_SPACE_IDS.voicePreset, "", { text, language: "English", speaker: localStorage.getItem("lrbgs-buddy-voice-preset") || "Ryan", instruct: "Natural conversational delivery with gentle pauses, varied pacing and relaxed breath between phrases.", model_size: "1.7B" }, setStatus), TTS_TIMEOUT_MS, "Buddy's voice service timed out.");
      const logical = cloneMode ? "voiceClone" : "voicePreset";
      const space = lastSuccessfulFreeSpace(logical, VOICE_FALLBACK_SPACE);
      const url = freeArtifactUrl(result, space);
      if (!url) throw new Error("No speech audio returned.");
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.onended = () => { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); };
      audioRef.current.onerror = () => { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); };
      await audioRef.current.play();
      return;
    } catch (error) {
      console.warn("Buddy natural TTS unavailable; using device speech", error);
      setStatus("Buddy is using the device voice while the free natural voice engine recovers…");
    }
    if (!window.speechSynthesis) { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onend = () => { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); };
    utterance.onerror = () => { speakingRef.current = false; if (liveRef.current) window.setTimeout(() => void startListening(), 80); };
    window.speechSynthesis.speak(utterance);
  };

  const send = async (forced?: string, voice = false) => {
    const text = (forced ?? input).trim();
    if (!text || busyRef.current) return;
    stopRecognition(); stopMonitor();
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next); setInput(""); busyRef.current = true; setBusy(true); setStatus("Buddy is thinking…");
    let reply = "";
    try {
      const memories = await withTimeout(memoryContext(text, 8), 5000, "Memory lookup timed out.");
      let research = "";
      if (shouldResearch(text)) {
        setResearching(true); setStatus("Buddy is checking fresh information…");
        try {
          const results = await withTimeout(liveWebSearch(text), RESEARCH_TIMEOUT_MS, "Live research timed out.");
          research = results.slice(0, 6).map((result, index) => `${index + 1}. ${result.title} — ${result.source}\n${result.snippet}\n${result.url}`).join("\n\n");
        } catch { /* research is optional */ }
        setResearching(false);
      }
      const context: Message[] = [];
      if (memories) context.push({ role: "assistant", content: `Long-term memory that may matter:\n${memories}` });
      if (research) context.push({ role: "assistant", content: `Fresh research notes:\n${research}` });
      context.push(...next);
      const result = await withTimeout(runLocalChat(context), CHAT_TIMEOUT_MS, "Buddy's local brain timed out.");
      reply = extract(result).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } catch (error) {
      console.warn("Buddy primary brain unavailable; using deterministic response", error);
      reply = fallback(text);
    }
    if (!reply) reply = fallback(text);
    setMessages([...next, { role: "assistant" as const, content: reply }]);
    void rememberConversation(text, reply).catch(() => undefined);
    busyRef.current = false; setBusy(false); setResearching(false);
    if (voice || liveRef.current) void speak(reply); else setStatus("Buddy is ready.");
  };

  const transcribe = async (blob: Blob) => {
    setStatus("Buddy is understanding you…");
    try {
      let text = "";
      try { text = extract(await withTimeout(runLocalSpeechToText(blob), STT_TIMEOUT_MS, "Local speech recognition timed out.")); } catch { /* use public fallback */ }
      if (!text) {
        const result = await withTimeout(runGradio(FREE_SPACE_IDS.speechToText, "", { audio: blob }, setStatus), STT_TIMEOUT_MS, "Free speech recognition timed out.");
        text = extract(result);
      }
      if (text) await send(text, true); else if (liveRef.current) window.setTimeout(() => void startListening(), 80);
    } catch (error) {
      console.warn("Speech-to-text failed", error);
      if (liveRef.current) { setStatus("I didn't catch that. Listening again…"); window.setTimeout(() => void startListening(), 80); }
    }
  };

  const startRecorderFallback = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Microphone capture unavailable");
    if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const supported = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = supported ? new MediaRecorder(streamRef.current, { mimeType: supported }) : new MediaRecorder(streamRef.current);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => { recorderRef.current = null; setListening(false); stopMonitor(); if (chunks.length && liveRef.current) void transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })); };
    recorder.onerror = () => { recorderRef.current = null; setListening(false); stopMonitor(); if (liveRef.current) window.setTimeout(() => void startListening(), 80); };
    recorderRef.current = recorder; recorder.start(); setListening(true); setStatus("Listening…"); heardSpeechRef.current = false; silenceSinceRef.current = null;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    try {
      const context = new AudioContextCtor();
      const source = context.createMediaStreamSource(streamRef.current); const analyser = context.createAnalyser(); analyser.fftSize = 2048; source.connect(analyser);
      audioContextRef.current = context; analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (!recorderRef.current || recorderRef.current !== recorder || !liveRef.current) return;
        analyser.getByteTimeDomainData(data); let sum = 0;
        for (const sample of data) { const n = (sample - 128) / 128; sum += n * n; }
        const rms = Math.sqrt(sum / data.length); const now = performance.now();
        if (rms >= SPEECH_RMS) { heardSpeechRef.current = true; silenceSinceRef.current = null; }
        else if (heardSpeechRef.current) { if (silenceSinceRef.current === null) silenceSinceRef.current = now; else if (now - silenceSinceRef.current >= SILENCE_MS) { recorder.stop(); return; } }
        rafRef.current = requestAnimationFrame(monitor);
      };
      rafRef.current = requestAnimationFrame(monitor);
    } catch { /* microphone still records; speech is submitted when recorder stops */ }
  };

  const startListening = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recognitionRef.current || recorderRef.current) return;
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (Constructor) {
      const recognition = new Constructor();
      // Single utterances are deliberately used here. Android browsers are much more reliable
      // at emitting a final transcript when continuous=false; onend immediately restarts it.
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = navigator.language || "en-US";
      recognition.onresult = (event) => {
        let finalText = "";
        for (let index = 0; index < event.results.length; index += 1) { const result = event.results.item(index); if (result.isFinal) finalText += result[0].transcript; }
        if (finalText.trim() && !busyRef.current) void send(finalText, true);
      };
      recognition.onend = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current && !speakingRef.current) window.setTimeout(() => void startListening(), 100); };
      recognition.onerror = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current && !speakingRef.current) window.setTimeout(() => void startRecorderFallback(), 100); };
      recognitionRef.current = recognition;
      try { recognition.start(); setListening(true); setStatus("Listening…"); return; } catch { recognitionRef.current = null; }
    }
    await startRecorderFallback();
  };

  const stopAll = () => {
    liveRef.current = false; stopRecognition();
    try { if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop(); } catch { /* already stopped */ }
    recorderRef.current = null; stopMonitor(); streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    audioRef.current?.pause(); window.speechSynthesis?.cancel(); speakingRef.current = false; setListening(false);
  };

  const toggle = () => {
    if (liveRef.current) { stopAll(); setLive(false); setStatus("Buddy is ready."); return; }
    liveRef.current = true; setLive(true); setStatus("Starting hands-free Live Conversation…");
    void (async () => {
      try { if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone capture unavailable"); if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); await startListening(); }
      catch { liveRef.current = false; setLive(false); stopAll(); setStatus("Microphone access is required for Live Conversation."); }
    })();
  };

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown; if (Array.isArray(saved)) setMessages(saved.filter((m): m is Message => Boolean(m && typeof m === "object" && (m as Message).role && typeof (m as Message).content === "string")).slice(-30)); } catch { setMessages([]); }
    return () => stopAll();
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); }, [messages]);

  return <Panel eyebrow="BUDDY • LIVE" title="Talk to Buddy" icon={<Sparkles className="size-5" />} defaultOpen>
    <div className="buddy-live-stage" data-live={live} data-listening={listening} data-speaking={speakingRef.current}><div className="buddy-live-pulse" /><div><strong>{live ? (listening ? "Buddy is listening" : "Buddy is with you") : "Buddy is ready"}</strong><span>{researching ? "Checking fresh information…" : status}</span></div></div>
    <div className="mt-3 flex flex-wrap gap-2"><StudioButton onClick={toggle} aria-pressed={live}><Mic className="size-4" />{live ? "Live Conversation On" : "Start Hands-Free Conversation"}</StudioButton><button type="button" onClick={() => { setMuted((current) => !current); if (!muted) { audioRef.current?.pause(); window.speechSynthesis?.cancel(); } }} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/75">{muted ? <VolumeX className="mr-2 inline size-4" /> : <Volume2 className="mr-2 inline size-4" />}{muted ? "Muted" : "Sound On"}</button></div>
    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3" aria-live="polite">{messages.length === 0 ? <p className="text-sm text-white/45">Say hello or type a message. Buddy will keep the conversation going without a Studio turn timer.</p> : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-xl p-3 text-sm ${message.role === "user" ? "ml-8 bg-red-500/10 text-white/85" : "mr-8 bg-white/[.04] text-white/75"}`}><strong className="mr-2 text-xs uppercase tracking-wider text-red-300">{message.role === "user" ? "You" : "Buddy"}</strong>{message.content}</div>)}</div>
    <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Talk or type to Buddy…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/50" /><StudioButton type="submit" disabled={busy || !input.trim()} aria-label="Send message">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</StudioButton></form>
    <p className="mt-2 text-[11px] text-white/30">No Studio-imposed conversation cutoff. Browser speech recognition may restart between utterances automatically; free AI providers may have their own queue limits.</p>
  </Panel>;
}
