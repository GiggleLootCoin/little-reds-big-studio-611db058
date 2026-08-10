import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { runGradio, FREE_SPACE_IDS } from "@/lib/gradio-free";
import { freeArtifactUrl } from "@/lib/free-artifact";
import { memoryContext, rememberConversation } from "@/lib/buddy-memory";
import { liveWebSearch, shouldResearch } from "@/lib/buddy-web";
import { loadStoredBuddyVoice } from "./VoiceLabPanel";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type RecognitionEvent = { results: { length: number; item(index: number): { isFinal: boolean; 0: { transcript: string } } } };
type RecognitionLike = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; abort: () => void; onresult: ((event: RecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };

const KEY = "lrbgs-buddy-chat-v12";
const RECORD_WINDOW_MS = 6000;
const VOICE_SPACE = "Qwen/Qwen3-TTS";

function extract(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return extract(value.at(-1));
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
  if (query.includes("video")) return "Let's make it visual. Tell me the song, image or idea and I'll choose the best available route.";
  if (query.includes("voice")) return "I can work with a voice you own or have permission to use. I'll handle the technical conversion behind the scenes.";
  return "I'm Buddy. Tell me what you want to make, change or figure out.";
}

export function BuddyLiveChatLite() {
  const [messages, setMessages] = useState<Message[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [live, setLive] = useState(false); const [listening, setListening] = useState(false); const [muted, setMuted] = useState(false); const [status, setStatus] = useState("Buddy is ready."); const [researching, setResearching] = useState(false);
  const liveRef = useRef(false); const busyRef = useRef(false); const speakingRef = useRef(false); const recognitionRef = useRef<RecognitionLike | null>(null); const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null); const timerRef = useRef<number | null>(null); const audioRef = useRef<HTMLAudioElement | null>(null); const brainRef = useRef<unknown>(null);
  const stopRecognition = () => { try { recognitionRef.current?.abort(); } catch { /* already stopped */ } recognitionRef.current = null; };

  const speakNaturally = async (text: string) => {
    if (muted) { speakingRef.current = false; void startListening(); return; }
    speakingRef.current = true; stopRecognition(); setStatus("Buddy is speaking…");
    try {
      const reference = await loadStoredBuddyVoice();
      const cloneMode = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const preset = localStorage.getItem("lrbgs-buddy-voice-preset") || "Ryan";
      const result = cloneMode
        ? await runGradio(FREE_SPACE_IDS.voiceClone, "/generate_voice_clone", { ref_audio: reference, ref_text: "", target_text: text, language: "English", use_xvector_only: true, model_size: "1.7B" }, setStatus)
        : await runGradio(FREE_SPACE_IDS.voicePreset, "/generate_custom_voice", { text, language: "English", speaker: preset, instruct: "Natural conversational delivery with gentle pauses, varied pacing and relaxed breath between phrases.", model_size: "1.7B" }, setStatus);
      const url = freeArtifactUrl(result, VOICE_SPACE);
      if (!url) throw new Error("No speech audio returned");
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.pause(); audioRef.current.src = url;
      audioRef.current.onended = () => { speakingRef.current = false; if (liveRef.current) void startListening(); };
      audioRef.current.onerror = () => { speakingRef.current = false; if (liveRef.current) void startListening(); };
      await audioRef.current.play(); return;
    } catch (error) { console.warn("Buddy natural TTS unavailable", error); }
    if (!window.speechSynthesis) { speakingRef.current = false; if (liveRef.current) void startListening(); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.96; utterance.pitch = 1;
    utterance.onend = () => { speakingRef.current = false; if (liveRef.current) void startListening(); }; utterance.onerror = () => { speakingRef.current = false; if (liveRef.current) void startListening(); }; window.speechSynthesis.speak(utterance);
  };

  const send = async (forced?: string, voice = false) => {
    const text = (forced ?? input).trim(); if (!text || busyRef.current) return; stopRecognition();
    const next = [...messages, { role: "user" as const, content: text }].slice(-16); setMessages(next); setInput(""); busyRef.current = true; setBusy(true); setStatus("Buddy is thinking…"); let reply = "";
    try {
      const memories = await memoryContext(text, 8); let research = "";
      if (shouldResearch(text)) { setResearching(true); setStatus("Buddy is checking the live web…"); const results = await liveWebSearch(text); research = results.slice(0, 6).map((result, index) => `${index + 1}. ${result.title} — ${result.source}\n${result.snippet}\n${result.url}`).join("\n\n"); setResearching(false); }
      if (!brainRef.current) {
        const load = new Function("url", "return import(url)") as (url: string) => Promise<{ pipeline: (task: string, model: string, options: Record<string, string>) => Promise<unknown> }>;
        const mod = await load("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm"); brainRef.current = await mod.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", { device: "wasm", dtype: "q4" });
      }
      const brain = brainRef.current as (messages: Message[], options: Record<string, unknown>) => Promise<unknown>; const context: Message[] = [];
      if (memories) context.push({ role: "assistant", content: `Long-term memory that may matter:\n${memories}` }); if (research) context.push({ role: "assistant", content: `Fresh web research. Treat these as research notes, not as guaranteed truth:\n${research}` }); context.push(...next);
      const result = await brain(context, { max_new_tokens: 220, temperature: 0.7, do_sample: true, return_full_text: false }); reply = extract(result).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } catch (error) { console.warn("Buddy local brain unavailable", error); setResearching(false); }
    if (!reply) reply = fallback(text); const updated = [...next, { role: "assistant" as const, content: reply }]; setMessages(updated); void rememberConversation(text, reply); busyRef.current = false; setBusy(false); setResearching(false); if (voice || liveRef.current) void speakNaturally(reply); else setStatus("Buddy is ready.");
  };

  const transcribeRecorded = async (blob: Blob) => {
    setStatus("Buddy is understanding you…");
    try { const result = await runGradio(FREE_SPACE_IDS.speechToText, "/predict", { audio: blob }, setStatus); const text = extract(result); if (text) await send(text, true); else if (liveRef.current) void startListening(); }
    catch (error) { console.warn("Speech-to-text failed", error); setStatus("I didn't catch that. Listening again…"); if (liveRef.current) void startListening(); }
  };

  const startRecorderFallback = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Microphone capture unavailable");
    if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    const recorder = type ? new MediaRecorder(streamRef.current, { mimeType: type }) : new MediaRecorder(streamRef.current); const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => { recorderRef.current = null; setListening(false); if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } if (chunks.length && liveRef.current) void transcribeRecorded(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })); };
    recorder.onerror = () => { recorderRef.current = null; setListening(false); if (liveRef.current) void startListening(); };
    recorderRef.current = recorder; recorder.start(); setListening(true); setStatus("Listening…");
    timerRef.current = window.setTimeout(() => { if (recorderRef.current === recorder && recorder.state === "recording") recorder.stop(); }, RECORD_WINDOW_MS);
  };

  const startListening = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recognitionRef.current || recorderRef.current) return;
    const speechWindow = window as SpeechWindow; const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (Constructor) {
      const recognition = new Constructor(); recognition.continuous = false; recognition.interimResults = true; recognition.lang = navigator.language || "en-US";
      recognition.onresult = (event) => { let finalText = ""; for (let index = 0; index < event.results.length; index += 1) { const result = event.results.item(index); if (result.isFinal) finalText += result[0].transcript; } if (finalText.trim()) void send(finalText, true); };
      recognition.onend = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current && !speakingRef.current) window.setTimeout(() => void startListening(), 150); };
      recognition.onerror = () => { recognitionRef.current = null; setListening(false); if (liveRef.current && !busyRef.current && !speakingRef.current) void startRecorderFallback(); };
      recognitionRef.current = recognition;
      try { recognition.start(); setListening(true); setStatus("Listening…"); return; } catch { recognitionRef.current = null; }
    }
    await startRecorderFallback();
  };

  const stopAll = () => { liveRef.current = false; stopRecognition(); if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop(); recorderRef.current = null; streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; audioRef.current?.pause(); window.speechSynthesis?.cancel(); speakingRef.current = false; setListening(false); };
  const toggle = () => {
    if (liveRef.current) { stopAll(); setLive(false); setStatus("Buddy is ready."); return; }
    liveRef.current = true; setLive(true); setStatus("Starting Live Conversation…");
    void (async () => { try { if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone capture unavailable"); if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); await startListening(); } catch { liveRef.current = false; setLive(false); stopAll(); setStatus("Microphone access is required for Live Conversation."); } })();
  };

  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown; if (Array.isArray(saved)) setMessages(saved.filter((message): message is Message => Boolean(message && typeof message === "object" && (message as Message).role && typeof (message as Message).content === "string")).slice(-30)); } catch { setMessages([]); } return () => stopAll(); }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); }, [messages]);

  return <Panel eyebrow="BUDDY • LIVE" title="Talk to Buddy" icon={<Sparkles className="size-5" />} defaultOpen>
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground" aria-live="polite">{researching ? "Buddy is researching…" : status}</div>
    <div className="flex flex-wrap gap-2"><StudioButton onClick={toggle} aria-pressed={live}><Mic className="size-4" />{live ? "Live Conversation On" : "Start Live Conversation"}</StudioButton><button type="button" onClick={() => { setMuted((current) => !current); if (!muted) { audioRef.current?.pause(); window.speechSynthesis?.cancel(); } }} className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold">{muted ? <VolumeX className="mr-2 inline size-4" /> : <Volume2 className="mr-2 inline size-4" />}{muted ? "Muted" : "Sound On"}</button></div>
    <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background/35 p-3">{!messages.length && <p className="text-sm text-muted-foreground">“Hi! I'm Buddy. What are we making?”</p>}{messages.map((message, index) => <div key={`${index}-${message.role}`} className={message.role === "user" ? "ml-auto max-w-[88%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "max-w-[92%] rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"}>{message.content}</div>)}{listening && <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">Listening…</div>}{busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Buddy is thinking…</div>}</div>
    <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} disabled={busy} placeholder="Talk to Buddy…" className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><StudioButton onClick={() => void send()} disabled={busy || !input.trim()}><Send className="size-4" /></StudioButton></div>
  </Panel>;
}
