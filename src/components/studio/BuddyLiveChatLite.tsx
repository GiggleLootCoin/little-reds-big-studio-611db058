import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type Generator = (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: Record<string, unknown>,
) => Promise<any>;
const KEY = "lrbgs-buddy-chat-v2";
const SYSTEM =
  "You are Buddy, the warm, practical creative assistant inside Little Red's Big Studio. Help with music, lyrics, artwork, video, vocals and YouTube. Be concise, useful and honest. Never claim a file was created unless the Studio actually returned one.";

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

export function BuddyLiveChatLite() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Buddy is ready.");
  const generatorRef = useRef<Generator | null>(null);
  const recognitionRef = useRef<any>(null);
  const handsFreeRef = useRef(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved.slice(-30));
    } catch {}
    return () => {
      recognitionRef.current?.abort?.();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const loadBrain = async () => {
    if (generatorRef.current) return generatorRef.current;
    setStatus("Buddy is waking up…");
    const mod = await import("@huggingface/transformers");
    const pipe = await mod.pipeline("text-generation", "onnx-community/Qwen2.5-0.5B", {
      device: "webgpu",
      dtype: "q4f16",
    } as any);
    generatorRef.current = pipe as Generator;
    return pipe as Generator;
  };

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    speakingRef.current = true;
    setStatus("Buddy is speaking…");
    u.onend = () => {
      speakingRef.current = false;
      setStatus("Buddy is ready.");
      if (handsFreeRef.current) startListening();
    };
    u.onerror = () => {
      speakingRef.current = false;
      if (handsFreeRef.current) startListening();
    };
    window.speechSynthesis.speak(u);
  };

  const send = async (forced?: string, fromVoice = false) => {
    const text = (forced ?? input).trim();
    if (!text || busy) return;
    recognitionRef.current?.stop?.();
    setListening(false);
    const next = [...messages, { role: "user" as const, content: text }].slice(-16);
    setMessages(next);
    setInput("");
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
        const raw = Array.isArray(out) ? out[0]?.generated_text : out?.generated_text;
        reply = typeof raw === "string" ? raw : raw?.at?.(-1)?.content || "";
        reply = String(reply)
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();
      } catch {
        reply = fallbackReply(text);
      }
      if (!reply) reply = fallbackReply(text);
      setMessages([...next, { role: "assistant", content: reply }]);
      setBusy(false);
      setStatus("Buddy is ready.");
      if (fromVoice || handsFreeRef.current) speak(reply);
    } catch {
      const reply = fallbackReply(text);
      setMessages([...next, { role: "assistant", content: reply }]);
      setBusy(false);
      setStatus("Buddy is ready.");
    }
  };

  const startListening = () => {
    if (speakingRef.current || busy || listening) return;
    const W = window as any;
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("Live voice isn't available in this browser. You can still type to Buddy.");
      return;
    }
    if (!recognitionRef.current) {
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = false;
      r.lang = "en-GB";
      r.onresult = (e: any) => {
        const last = e.results?.[e.results.length - 1];
        const text = last?.[0]?.transcript?.trim();
        if (text) void send(text, true);
      };
      r.onend = () => {
        setListening(false);
        if (handsFreeRef.current && !speakingRef.current && !busy)
          window.setTimeout(startListening, 300);
      };
      r.onerror = (e: any) => {
        setListening(false);
        if (e?.error === "not-allowed")
          setStatus("Allow microphone access in Chrome to use Live Voice.");
      };
      recognitionRef.current = r;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
      setStatus("Listening…");
    } catch {}
  };
  const toggleLive = () => {
    const next = !handsFree;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (next) startListening();
    else {
      recognitionRef.current?.stop?.();
      setListening(false);
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
          {handsFree ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          {handsFree ? "Live Voice On" : "Live Voice"}
        </StudioButton>
        <button
          type="button"
          onPointerDown={() => !handsFree && startListening()}
          onPointerUp={() => !handsFree && recognitionRef.current?.stop?.()}
          className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold"
          disabled={handsFree}
        >
          <Mic className="mr-2 inline size-4" />
          Hold to Talk
        </button>
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
