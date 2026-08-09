import { useEffect, useRef, useState } from "react";
import { Brain, LoaderCircle, Send, Sparkles } from "lucide-react";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type Generator = (messages: Message[], options: Record<string, unknown>) => Promise<any>;

const SYSTEM = `You are Buddy from Little Red's Big Studio. You are exceptionally intelligent, emotionally perceptive, practical and creative. You are a music-production and creator companion. Be concise unless detail helps. Never pretend an action happened when it did not. Be genuinely funny through timing, deadpan observations and occasional callbacks, but never force a joke. Protect the user's confidence. If the user is frustrated, be calm and useful. If a serious topic appears, drop the comedy. Help with songwriting, production, vocals, RVC, artwork, video, YouTube and creative decisions. You have no paid APIs and must never ask for an API key. Keep private reasoning private; give useful conclusions and actionable steps instead.`;

export function BuddyLiveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Buddy is ready to load locally when you need him.");
  const generatorRef = useRef<Generator | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lrbgs-buddy-chat") || "[]") as Message[];
      if (Array.isArray(saved)) setMessages(saved.slice(-40));
    } catch {
      // Corrupt local chat must never stop the Studio loading.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lrbgs-buddy-chat", JSON.stringify(messages.slice(-40)));
  }, [messages]);

  const load = async () => {
    if (generatorRef.current) return generatorRef.current;
    setStatus("Loading Buddy's local brain… first load is the big one.");
    const dynamicImport = new Function("url", "return import(url)") as (url: string) => Promise<any>;
    const lib = await dynamicImport("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1");
    const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
    const device = hasGpu ? "webgpu" : "wasm";
    const generator = await lib.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", {
      dtype: hasGpu ? "q4f16" : "q4",
      device,
    });
    generatorRef.current = generator as Generator;
    setStatus(device === "webgpu" ? "Buddy is running locally on your GPU." : "Buddy is running locally in the browser.");
    return generator as Generator;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }].slice(-20);
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const generator = await load();
      const prompt: Message[] = [{ role: "system", content: SYSTEM }, ...next];
      const output = await generator(prompt, {
        max_new_tokens: 320,
        temperature: 0.72,
        do_sample: true,
        return_full_text: false,
      });
      const raw = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
      const reply = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.at(-1)?.content : raw?.at?.(-1)?.content;
      const clean = String(reply || "I appear to have temporarily misplaced my brain. Give me another go.")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
      setMessages([...next, { role: "assistant", content: clean }]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Local model could not load on this device.");
      setMessages([...next, { role: "assistant", content: "The local brain couldn't start on this device. That's a device/runtime limitation, not a paid-service wall. Try the free WebGPU runner from the engine deck." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel eyebrow="Buddy — unlimited local chat" title="Talk to Buddy" icon={<Sparkles className="size-5" />} defaultOpen>
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Brain className="size-4 shrink-0 text-primary" />
        <span>{status}</span>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-background/35 p-3">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">“Alright, Red. What are we making?”</p>}
        {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${message.role === "user" ? "ml-auto crimson-gloss text-primary-foreground" : "border border-border bg-background/60"}`}>{message.content}</div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Buddy is thinking locally…</div>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder="Talk to Buddy…" disabled={busy} className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <StudioButton onClick={() => void send()} disabled={busy || !input.trim()} aria-label="Send message"><Send className="size-4" /></StudioButton>
      </div>
      <p className="text-[0.65rem] text-muted-foreground">No API key. No paid model. No message quota. Qwen3 loads once into the browser; inference stays on-device.</p>
    </Panel>
  );
}
