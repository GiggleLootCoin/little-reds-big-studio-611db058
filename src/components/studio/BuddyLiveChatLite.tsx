import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type Generator = (messages: ChatMessage[], options: Record<string, unknown>) => Promise<unknown>;
type GeneratorModule = { pipeline: (...args: unknown[]) => Promise<Generator> };
type RecognitionEvent = { results?: ArrayLike<ArrayLike<{ transcript?: string }>> };
type RecognitionError = { error?: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
};
type RecognitionConstructor = new () => Recognition;
const KEY = "lrbgs-buddy-chat-v4";
const SYSTEM =
  "You are Buddy, the warm, practical creative assistant inside Little Red's Big Studio. Help with music, lyrics, artwork, video, vocals and YouTube. Be concise, useful and honest. Never claim a file was created unless the Studio actually returned one.";
const LOCAL_MODELS = ["onnx-community/Qwen3-0.6B-ONNX", "onnx-community/Qwen2.5-0.5B"];

function fallbackReply(text: string) {
  const q = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(q)) return "Hey, Red. I'm here. What are we making?";
  if (q.includes("song") || q.includes("music"))
    return "Absolutely. Give me the mood, genre and story, and we'll turn it into a song.";
  if (q.includes("lyric"))
    return "Give me the feeling and story. I'll help shape the words into verses, a chorus and a bridge.";
  if (q.includes("video"))
    return "Let's make it visual. Tell me the song's mood and the kind of world you want on screen.";
  if (q.includes("voice"))
    return "I can help you work with a voice you own or have permission to use. Tell me what you want the voice to do.";
  return "I'm with you. Tell me what you want to make, change or figure out, and we'll take it one step at a time.";
}

function generatedText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) return generatedText(value[0]);
  const record = value as Record<string, unknown>;
  if (typeof record.generated_text === "string") return record.generated_text;
  if (Array.isArray(record.generated_text)) return generatedText(record.generated_text.at(-1));
  if (record.generated_text && typeof record.generated_text === "object") {
    const nested = record.generated_text as Record<string, unknown>;
    return typeof nested.content === "string" ? nested.content : "";
  }
  return "";
}

export function BuddyLiveChatLite() {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [handsFree, setHandsFree] = useState(false),
    [muted, setMuted] = useState(false),
    [listening, setListening] = useState(false),
    [status, setStatus] = useState("Buddy is ready.");
  const generatorRef = useRef<Generator | null>(null),
    recognitionRef = useRef<Recognition | null>(null),
    handsFreeRef = useRef(false),
    busyRef = useRef(false),
    speakingRef = useRef(false),
    restartingRef = useRef(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved))
        setMessages(
          saved
            .filter((m): m is Message =>
              Boolean(
                m &&
                  typeof m === "object" &&
                  (m as Record<string, unknown>).role &&
                  typeof (m as Record<string, unknown>).content === "string",
              ),
            )
            .slice(-30),
        );
    } catch (error) {
      console.warn("Buddy history could not be restored", error);
    }
    return () => {
      handsFreeRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const loadBrain = async () => {
    if (generatorRef.current) return generatorRef.current;
    setStatus("Buddy is waking his local brain…");
    try {
      const dynamicImport = new Function("url", "return import(url)") as (
        url: string,
      ) => Promise<GeneratorModule>;
      const mod = await dynamicImport(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm",
      );
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      let lastError: unknown = null;
      for (const model of LOCAL_MODELS) {
        try {
          const pipe = await mod.pipeline("text-generation", model, {
            device: hasGpu ? "webgpu" : "wasm",
            dtype: hasGpu ? "q4f16" : "q4",
          });
          generatorRef.current = pipe;
          return pipe;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error("No local model loaded.");
    } catch (error) {
      console.warn(
        "Buddy local brain could not load; deterministic fallback remains available",
        error,
      );
      throw error;
    }
  };

  const startListening = () => {
    if (speakingRef.current || busyRef.current || listening) return;
    const W = window as unknown as {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("Live voice isn't available in this browser. Type to Buddy instead.");
      return;
    }
    if (!recognitionRef.current) {
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = false;
      r.lang = "en-US";
      r.onresult = (e) => {
        const last = e.results?.[e.results.length - 1];
        const text = last?.[0]?.transcript?.trim();
        if (text && handsFreeRef.current && !busyRef.current && !speakingRef.current) {
          void send(text, true);
        }
      };
      r.onend = () => {
        setListening(false);
        if (
          handsFreeRef.current &&
          !speakingRef.current &&
          !busyRef.current &&
          !restartingRef.current
        ) {
          restartingRef.current = true;
          window.setTimeout(() => {
            restartingRef.current = false;
            if (handsFreeRef.current) startListening();
          }, 250);
        }
      };
      r.onerror = (e) => {
        setListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          handsFreeRef.current = false;
          setHandsFree(false);
          setStatus("Allow microphone access in Chrome to use Live Conversation.");
        } else if (handsFreeRef.current) {
          setStatus("Live Conversation is reconnecting…");
        }
      };
      recognitionRef.current = r;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
      setStatus("Listening… Tap Live Conversation again to stop.");
    } catch (error) {
      console.warn("Speech recognition could not start", error);
    }
  };

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) {
      if (handsFreeRef.current) window.setTimeout(startListening, 250);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    speakingRef.current = true;
    setStatus("Buddy is speaking…");
    u.onend = () => {
      speakingRef.current = false;
      setStatus(handsFreeRef.current ? "Listening…" : "Buddy is ready.");
      if (handsFreeRef.current) window.setTimeout(startListening, 250);
    };
    u.onerror = () => {
      speakingRef.current = false;
      if (handsFreeRef.current) window.setTimeout(startListening, 250);
    };
    window.speechSynthesis.speak(u);
  };

  const send = async (forced?: string, fromVoice = false) => {
    const text = (forced ?? input).trim();
    if (!text || busyRef.current) return;
    if (!handsFreeRef.current) recognitionRef.current?.stop();
    setListening(false);
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next);
    setInput("");
    busyRef.current = true;
    setBusy(true);
    setStatus("Buddy is thinking…");
    try {
      let reply = "";
      try {
        const brain = await loadBrain();
        const out = await brain([{ role: "system", content: SYSTEM }, ...next], {
          max_new_tokens: 180,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
        });
        reply = generatedText(out)
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();
      } catch (error) {
        console.warn("Buddy local model unavailable; using conversational fallback", error);
        reply = fallbackReply(text);
      }
      if (!reply) reply = fallbackReply(text);
      setMessages([...next, { role: "assistant", content: reply }]);
      busyRef.current = false;
      setBusy(false);
      setStatus(handsFreeRef.current ? "Buddy is listening…" : "Buddy is ready.");
      if (fromVoice || handsFreeRef.current) speak(reply);
    } catch (error) {
      console.warn("Buddy response failed", error);
      const reply = fallbackReply(text);
      setMessages([...next, { role: "assistant", content: reply }]);
      busyRef.current = false;
      setBusy(false);
      setStatus(handsFreeRef.current ? "Buddy is listening…" : "Buddy is ready.");
      if (fromVoice || handsFreeRef.current) speak(reply);
    }
  };

  const toggleLive = () => {
    const next = !handsFreeRef.current;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (next) {
      setStatus("Starting Live Conversation…");
      startListening();
    } else {
      recognitionRef.current?.stop();
      setListening(false);
      window.speechSynthesis?.cancel();
      speakingRef.current = false;
      setStatus("Buddy is ready.");
    }
  };

  return (
    <Panel
      eyebrow="BUDDY • LIVE"
      title="Talk to Buddy"
      icon={<Sparkles className="size-5" />}
      defaultOpen
    >
      <div
        className="rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {status}
      </div>
      <div className="flex flex-wrap gap-2">
        <StudioButton onClick={toggleLive} aria-pressed={handsFree}>
          <Mic className="size-4" />
          {handsFree ? "Live Conversation On" : "Start Live Conversation"}
        </StudioButton>
        <button
          type="button"
          onClick={() => {
            setMuted(!muted);
            if (!muted) window.speechSynthesis?.cancel();
          }}
          className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold"
        >
          {muted ? (
            <VolumeX className="mr-2 inline size-4" />
          ) : (
            <Volume2 className="mr-2 inline size-4" />
          )}
          {muted ? "Muted" : "Sound On"}
        </button>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background/35 p-3">
        {!messages.length && (
          <p className="text-sm text-muted-foreground">“Alright, Red. What are we making?”</p>
        )}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={
              m.role === "user"
                ? "ml-auto max-w-[88%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[92%] rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
        {listening && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
            Listening…
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Buddy is thinking…
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          disabled={busy}
          placeholder="Talk to Buddy…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <StudioButton onClick={() => void send()} disabled={busy || !input.trim()}>
          <Send className="size-4" />
        </StudioButton>
      </div>
    </Panel>
  );
}
