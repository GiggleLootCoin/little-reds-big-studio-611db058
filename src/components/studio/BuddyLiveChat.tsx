import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Captions,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Panel, StudioButton } from "./ui";

type Message = { role: "user" | "assistant"; content: string };
type PromptMessage = Message | { role: "system"; content: string };
type GeneratedText = string | Array<{ role?: string; content?: string }>;
type GeneratorOutput =
  Array<{ generated_text?: GeneratedText }> | { generated_text?: GeneratedText };
type Generator = (
  messages: PromptMessage[],
  options: Record<string, unknown>,
) => Promise<GeneratorOutput>;
type TransformersModule = {
  pipeline: (task: string, model: string, options: Record<string, unknown>) => Promise<unknown>;
};
type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const SYSTEM = `You are Buddy from Little Red's Big Studio. You are intelligent, practical, creative and emotionally perceptive. You help with songwriting, production, vocals, RVC, artwork, video and YouTube. Be concise unless detail helps. Never pretend an action happened when it did not. Never ask for a paid API key. Keep private reasoning private and give useful conclusions.`;
const CHAT_KEY = "lrbgs-buddy-chat";
const VOICE_KEY = "lrbgs-buddy-voice";

export function BuddyLiveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(
    "Buddy is ready. Turn on Live Voice for hands-free conversation.",
  );
  const [interim, setInterim] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const generatorRef = useRef<Generator | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handsFreeRef = useRef(false);
  const speakingRef = useRef(false);
  const busyRef = useRef(false);
  const listeningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]") as Message[];
      if (Array.isArray(saved)) setMessages(saved.slice(-40));
      setVoiceName(localStorage.getItem(VOICE_KEY) || "");
    } catch {
      // Corrupt local state must never stop the Studio loading.
    }
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      setVoices(available);
      if (!voiceName) {
        const preferred = available.find((voice) => /en[-_](GB|US)/i.test(voice.lang));
        if (preferred) setVoiceName(preferred.name);
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, [voiceName]);

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, voiceName);
  }, [voiceName]);

  const load = async () => {
    if (generatorRef.current) return generatorRef.current;
    setStatus("Loading Buddy's local brain… first load is the big one.");
    const dynamicImport = new Function("url", "return import(url)") as (
      url: string,
    ) => Promise<TransformersModule>;
    const lib = await dynamicImport("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0");
    const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
    const device = hasGpu ? "webgpu" : "wasm";
    const generator = await lib.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", {
      dtype: hasGpu ? "q4f16" : "q4",
      device,
    });
    generatorRef.current = generator as Generator;
    setStatus(
      device === "webgpu"
        ? "Buddy is running locally on your GPU."
        : "Buddy is running locally in the browser.",
    );
    return generator as Generator;
  };

  const startListening = () => {
    if (speakingRef.current || busyRef.current || listeningRef.current) return;
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setStatus("Live Voice needs Chrome's speech recognition on Android. Text chat still works.");
      return;
    }
    if (!recognitionRef.current) {
      const recognition = new Constructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let finalText = "";
        let partial = "";
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0]?.transcript || "";
          else partial += result[0]?.transcript || "";
        }
        setInterim(partial.trim());
        if (finalText.trim()) {
          setInterim("");
          void send(finalText.trim(), true);
        }
      };
      recognition.onend = () => {
        listeningRef.current = false;
        setListening(false);
        if (handsFreeRef.current && !speakingRef.current && !busyRef.current) {
          window.setTimeout(startListening, 250);
        }
      };
      recognition.onerror = (event) => {
        listeningRef.current = false;
        setListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setStatus(
            "Microphone permission is needed for Live Voice. Allow the mic in Chrome, then try again.",
          );
        } else if (handsFreeRef.current) {
          setStatus("Live Voice is reconnecting…");
        }
      };
      recognitionRef.current = recognition;
    }
    try {
      recognitionRef.current.start();
      listeningRef.current = true;
      setListening(true);
      setStatus("Listening hands-free… speak naturally. Buddy will answer aloud.");
    } catch {
      // Browser can throw if recognition is already active; its existing session continues.
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    listeningRef.current = false;
    setListening(false);
  };

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const selected = voices.find((voice) => voice.name === voiceName);
    if (selected) utterance.voice = selected;
    utterance.rate = 1.02;
    speakingRef.current = true;
    setStatus("Buddy is speaking…");
    utterance.onend = () => {
      speakingRef.current = false;
      if (handsFreeRef.current) startListening();
      else setStatus("Buddy is ready.");
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      if (handsFreeRef.current) startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const send = async (providedText?: string, fromVoice = false) => {
    const text = (providedText ?? input).trim();
    if (!text || busyRef.current) return;
    stopListening();
    busyRef.current = true;
    setBusy(true);
    const next = [...messages, { role: "user" as const, content: text }].slice(-20);
    setMessages(next);
    setInput("");
    try {
      const generator = await load();
      const prompt: PromptMessage[] = [{ role: "system", content: SYSTEM }, ...next];
      const output = await generator(prompt, {
        max_new_tokens: 320,
        temperature: 0.72,
        do_sample: true,
        return_full_text: false,
      });
      const raw = Array.isArray(output) ? output[0]?.generated_text : output.generated_text;
      const reply =
        typeof raw === "string" ? raw : raw?.length ? raw[raw.length - 1]?.content : undefined;
      const clean = String(
        reply || "I appear to have temporarily misplaced my brain. Give me another go.",
      )
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
      if (!mountedRef.current) return;
      setMessages([...next, { role: "assistant", content: clean }]);
      busyRef.current = false;
      setBusy(false);
      if (fromVoice || handsFreeRef.current) speak(clean);
      else setStatus("Buddy is ready.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Local model could not load on this device.",
      );
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "The local brain could not start on this device. Try the free WebGPU runner from the engine deck.",
        },
      ]);
      busyRef.current = false;
      setBusy(false);
    }
  };

  const toggleHandsFree = () => {
    const next = !handsFree;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (next) {
      setStatus("Starting Live Voice… allow microphone access if Android asks.");
      startListening();
    } else {
      stopListening();
      setStatus("Live Voice paused. Buddy is ready.");
    }
  };

  return (
    <Panel
      eyebrow="Buddy — Live Voice"
      title="Talk to Buddy"
      icon={<Sparkles className="size-5" />}
      defaultOpen
    >
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Brain className="size-4 shrink-0 text-primary" />
        <span>{status}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <StudioButton
          onClick={toggleHandsFree}
          aria-pressed={handsFree}
          className={handsFree ? "crimson-gloss text-primary-foreground" : ""}
        >
          {handsFree ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          {handsFree ? "Live Voice On" : "Live Voice"}
        </StudioButton>
        <button
          type="button"
          onPointerDown={() => !handsFree && startListening()}
          onPointerUp={() => !handsFree && stopListening()}
          onPointerCancel={() => !handsFree && stopListening()}
          onPointerLeave={() => !handsFree && stopListening()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary/50 disabled:opacity-50"
          disabled={handsFree}
        >
          <Mic className="size-4" /> Hold to Talk
        </button>
        <button
          type="button"
          onClick={() => {
            setMuted((value) => {
              const next = !value;
              if (next) window.speechSynthesis?.cancel();
              return next;
            });
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary/50"
          aria-pressed={muted}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted ? "Muted" : "Sound On"}
        </button>
      </div>

      {voices.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Buddy voice</span>
          <select
            value={voiceName}
            onChange={(event) => setVoiceName(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-2 py-2 text-xs text-foreground"
          >
            {voices
              .filter((voice) => /^en/i.test(voice.lang))
              .map((voice) => (
                <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
          </select>
        </label>
      )}

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-background/35 p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">“Alright, Red. What are we making?”</p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-auto crimson-gloss text-primary-foreground"
                : "border border-border bg-background/60"
            }`}
          >
            {message.content}
          </div>
        ))}
        {(interim || listening) && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            <Captions className="size-4 shrink-0" />
            <span>{interim || "Listening…"}</span>
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Buddy is thinking locally…
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          placeholder="Type to Buddy…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <StudioButton
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </StudioButton>
      </div>

      <p className="text-[0.65rem] text-muted-foreground">
        Live Voice uses the browser microphone and Android speech engine. Conversation captions and
        history stay in this browser. No API key or paid voice service is required.
      </p>
    </Panel>
  );
}
