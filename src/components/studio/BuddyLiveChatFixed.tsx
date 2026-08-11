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

const KEY = "lrbgs-buddy-chat-v19";
const STT_TIMEOUT = 60000;
const CHAT_TIMEOUT = 15000;
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
  if (Array.isArray(value)) return value.map(textOf).find(Boolean) || "";
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of [
    "generated_text",
    "text",
    "transcription",
    "transcript",
    "content",
    "value",
    "data",
  ]) {
    const found = textOf(record[key]);
    if (found) return found;
  }
  return "";
}

function fallback(text: string) {
  const query = text.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(query)) {
    return "Hey! I'm Buddy. I'm listening. What are we making?";
  }
  if (query.includes("song") || query.includes("music")) {
    return "Absolutely. Give me the idea, mood, lyrics or reference and we'll build it.";
  }
  if (query.includes("video")) {
    return "Let's make it visual. Give me the scene or image and I'll choose the strongest free route.";
  }
  if (query.includes("voice")) {
    return "I can work with a voice you own or have permission to use. Tell me what you want changed.";
  }
  return "I heard you. Tell me what you want to make, change or figure out and I'll get to work.";
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function BuddyLiveChatFixed() {
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

  const speak = async (text: string) => {
    if (muted) return;
    window.speechSynthesis?.cancel();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    }
    try {
      const reference = await timeout(
        loadStoredBuddyVoice(),
        2000,
        "voice preference timeout",
      );
      const clone = localStorage.getItem("lrbgs-buddy-voice-mode") === "clone" && reference;
      const logical = clone ? FREE_SPACE_IDS.voiceClone : FREE_SPACE_IDS.voicePreset;
      const result = await timeout(
        runGradio(
          logical,
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
        "Buddy voice engine timed out",
      );
      const url = freeArtifactUrl(
        result,
        lastSuccessfulFreeSpace(logical, "Qwen/Qwen3-TTS"),
      );
      if (url) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch {
      // Device speech is the no-key fallback.
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
        ? [
            {
              role: "assistant" as const,
              content: `Relevant memory:\n${memory}`,
            },
            ...next,
          ]
        : next;
      reply = textOf(await timeout(runLocalChat(context), CHAT_TIMEOUT, "local Buddy brain timeout"))
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

  const stopRecorder = () => {
    try {
      recorderRef.current?.stop();
    } catch {
      // Ignore an already-stopped recorder.
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false);
  };

  const remoteTranscribe = async (blob: Blob) =>
    textOf(
      await timeout(
        runGradio("speechToText", "", { audio: blob }, setStatus),
        STT_TIMEOUT,
        "free speech recognition timed out",
      ),
    );

  const startRecorder = async () => {
    if (!liveRef.current || busyRef.current || recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("This browser does not provide microphone recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const mime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        recorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setListening(false);
        void (async () => {
          try {
            let text = "";
            try {
              text = textOf(
                await timeout(
                  runLocalSpeechToText(blob),
                  STT_TIMEOUT,
                  "local Whisper timed out",
                ),
              );
            } catch {
              // Remote fallback below.
            }
            if (!text) text = await remoteTranscribe(blob);
            if (!text) {
              throw new Error("No speech was detected. Try speaking a little closer to the microphone.");
            }
            await send(text, true);
          } catch (error) {
            setStatus(
              error instanceof Error
                ? error.message
                : "I couldn't understand that. Try again.",
            );
          }
          if (liveRef.current && !busyRef.current) {
            window.setTimeout(() => void startRecorder(), 350);
          }
        })();
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setListening(true);
      setStatus("Listening… speak naturally, then pause.");
      window.setTimeout(() => {
        if (recorderRef.current === recorder) recorder.stop();
      }, 10000);
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
        recognitionRef.current = null;
        setListening(false);
        if (liveRef.current && !busyRef.current) void startRecorder();
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
        if (liveRef.current && !busyRef.current) {
          window.setTimeout(() => {
            if (!startBrowserRecognition()) void startRecorder();
          }, 250);
        }
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
      // Ignore an already-stopped recognition session.
    }
    recognitionRef.current = null;
    stopRecorder();
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
    if (!startBrowserRecognition()) void startRecorder();
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved.slice(-30));
    } catch {
      // Ignore invalid stored history.
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
      <div
        className="buddy-live-stage"
        data-live={live}
        data-listening={listening}
      >
        <div className="buddy-live-pulse" />
        <div>
          <strong>
            {live
              ? listening
                ? "Buddy is listening"
                : "Buddy is with you"
              : "Buddy is ready"}
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
            setMuted((mutedValue) => !mutedValue);
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
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl p-3 text-sm ${
                message.role === "user"
                  ? "ml-8 bg-red-500/10 text-white/85"
                  : "mr-8 bg-white/[.04] text-white/75"
              }`}
            >
              <strong className="mr-2 text-xs uppercase tracking-wider text-red-300">
                {message.role === "user" ? "You" : "Buddy"}
              </strong>
              {message.content}
            </div>
          ))
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
          placeholder="Talk or type to Buddy…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/50"
        />
        <StudioButton
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
        >
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </StudioButton>
      </form>
      <p className="mt-2 text-[11px] text-white/30">
        Hands-free uses browser speech recognition first, then local Whisper, then a free public
        Whisper route. Buddy always has the device voice as a no-key speech fallback.
      </p>
    </Panel>
  );
}
