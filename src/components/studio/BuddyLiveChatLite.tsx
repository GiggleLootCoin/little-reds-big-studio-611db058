import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { runGradio, FREE_SPACE_IDS } from "@/lib/gradio-free";
import { useAuth } from "@/hooks/use-auth";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
const KEY = "lrbgs-buddy-chat-v7";
const WINDOW_MS = 6000;

function extract(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return extract(value.at(-1));
  if (!value || typeof value !== "object") return "";
  const r = value as Record<string, unknown>;
  for (const key of ["generated_text", "text", "transcription", "value", "content", "data"]) {
    const found = extract(r[key]);
    if (found) return found;
  }
  return "";
}

function fallback(text: string, name: string) {
  const q = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(q)) return `Hey, ${name}. I'm Buddy. What are we making?`;
  if (q.includes("song") || q.includes("music")) return "Absolutely. Give me the idea, mood or lyrics and I'll handle the complicated bits.";
  if (q.includes("lyric")) return "Give me the feeling, story or subject and I'll shape it into a complete song structure.";
  if (q.includes("video")) return "Let's make it visual. Tell me the song, image or idea and I'll choose the best available route.";
  if (q.includes("voice")) return "I can work with a voice you own or have permission to use. I'll handle the technical conversion behind the scenes.";
  return `I'm here, ${name}. Tell me what you want to make, change or figure out.`;
}

export function BuddyLiveChatLite() {
  const { user } = useAuth();
  const name = user?.user_metadata.display_name || "Creator";
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
  const timerRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const brainRef = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
      if (Array.isArray(saved)) setMessages(saved.filter((m): m is Message => Boolean(m && typeof m === "object" && (m as Message).role && typeof (m as Message).content === "string")).slice(-30));
    } catch { setMessages([]); }
    return () => stop();
  }, []);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))), [messages]);

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) { speakingRef.current = false; schedule(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    speakingRef.current = true;
    setStatus("Buddy is speaking…");
    utterance.onend = () => { speakingRef.current = false; if (liveRef.current) start(); else setStatus("Buddy is ready."); };
    utterance.onerror = () => { speakingRef.current = false; if (liveRef.current) schedule(); };
    window.speechSynthesis.speak(utterance);
  };

  const send = async (forced?: string, voice = false) => {
    const text = (forced ?? input).trim();
    if (!text || busyRef.current) return;
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next); setInput(""); busyRef.current = true; setBusy(true); setStatus("Buddy is thinking…");
    let reply = "";
    try {
      if (!brainRef.current) {
        const load = new Function("url", "return import(url)") as (url: string) => Promise<any>;
        const mod = await load("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm");
        brainRef.current = await mod.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", { device: "wasm", dtype: "q4" });
      }
      const result = await brainRef.current([{ role: "system", content: `You are Buddy inside Little Red's Big Studio. Address this user as ${name}. Never call all users Red. Be concise, warm, practical and honest.` }, ...next], { max_new_tokens: 180, temperature: 0.7, do_sample: true, return_full_text: false });
      reply = extract(result).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } catch (error) { console.warn("Buddy brain unavailable; fallback used", error); }
    if (!reply) reply = fallback(text, name);
    setMessages([...next, { role: "assistant", content: reply }]);
    busyRef.current = false; setBusy(false);
    if (voice || liveRef.current) speak(reply); else setStatus("Buddy is ready.");
  };

  const transcribe = async (blob: Blob) => {
    setStatus("Buddy is understanding you…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.speechToText, "/predict", { inputs: blob, task: "transcribe" }, setStatus);
      const text = extract(result);
      if (text) await send(text, true); else if (liveRef.current) setStatus("I didn't catch that. Listening…");
    } catch (error) { console.warn("Speech-to-text failed", error); setStatus("Speech recognition is reconnecting…"); }
  };

  const start = async () => {
    if (!liveRef.current || busyRef.current || speakingRef.current || recorderRef.current) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Microphone unavailable");
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((x) => MediaRecorder.isTypeSupported(x));
      const recorder = type ? new MediaRecorder(streamRef.current, { mimeType: type }) : new MediaRecorder(streamRef.current);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { recorderRef.current = null; setListening(false); if (chunks.length) void transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })); };
      recorder.onerror = () => { recorderRef.current = null; setListening(false); if (liveRef.current) schedule(); };
      recorderRef.current = recorder; recorder.start(); setListening(true); setStatus(`Listening to ${name}… Speak naturally. Tap again to stop.`);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => { if (recorderRef.current === recorder && recorder.state === "recording") recorder.stop(); }, WINDOW_MS);
    } catch (error) { console.warn("Microphone failed", error); liveRef.current = false; setLive(false); setStatus("Allow microphone access in your browser, then try again."); }
  };
  const schedule = () => { if (!liveRef.current || busyRef.current || speakingRef.current) return; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = window.setTimeout(() => { timerRef.current = null; void start(); }, 300); };
  function stop() { liveRef.current = false; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop(); recorderRef.current = null; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; window.speechSynthesis?.cancel(); speakingRef.current = false; setListening(false); }
  const toggle = () => { if (liveRef.current) { stop(); setLive(false); setStatus("Buddy is ready."); } else { liveRef.current = true; setLive(true); setStatus("Starting Live Conversation…"); void start(); } };

  return <Panel eyebrow="BUDDY • LIVE" title={`Talk to Buddy, ${name}`} icon={<Sparkles className="size-5" />} defaultOpen>
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground" aria-live="polite">{status}</div>
    <div className="flex flex-wrap gap-2"><StudioButton onClick={toggle} aria-pressed={live}><Mic className="size-4" /> {live ? "Live Conversation On" : "Start Live Conversation"}</StudioButton><button type="button" onClick={() => { setMuted(!muted); if (!muted) window.speechSynthesis?.cancel(); }} className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold">{muted ? <VolumeX className="mr-2 inline size-4" /> : <Volume2 className="mr-2 inline size-4" />} {muted ? "Muted" : "Sound On"}</button></div>
    <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background/35 p-3">
      {!messages.length && <p className="text-sm text-muted-foreground">“Hi {name}. What are we making?”</p>}
      {messages.map((m, i) => <div key={`${i}-${m.role}`} className={m.role === "user" ? "ml-auto max-w-[88%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "max-w-[92%] rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"}>{m.content}</div>)}
      {listening && <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">Listening…</div>}
      {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Buddy is thinking…</div>}
    </div>
    <div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} disabled={busy} placeholder={`Talk to Buddy, ${name}…`} className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><StudioButton onClick={() => void send()} disabled={busy || !input.trim()}><Send className="size-4" /></StudioButton></div>
  </Panel>;
}
