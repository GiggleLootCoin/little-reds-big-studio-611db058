import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  FileText,
  Film,
  Image,
  LoaderCircle,
  Mic2,
  Music2,
  Save,
  Scissors,
  WandSparkles,
} from "lucide-react";
import { FREE_RUNNERS } from "@/lib/free-runners";
import { Note, Panel, Readout, StudioButton, StudioSlider } from "./ui";

type Generator = (
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: Record<string, unknown>,
) => Promise<unknown>;

type TransformersModule = {
  pipeline: (task: string, model: string, options: Record<string, unknown>) => Promise<unknown>;
};

function runner(id: string) {
  return FREE_RUNNERS.find((r) => r.id === id)!;
}

function generatedText(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;
  if (!first || typeof first !== "object") return "";
  const raw = (first as { generated_text?: unknown }).generated_text;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const last = raw.at(-1);
    if (last && typeof last === "object" && typeof (last as { content?: unknown }).content === "string") {
      return (last as { content: string }).content;
    }
  }
  return "";
}

export function FreeCreatePanel() {
  const [brief, setBrief] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [seconds, setSeconds] = useState(180);
  const [copied, setCopied] = useState(false);
  const [lyricsBusy, setLyricsBusy] = useState(false);
  const [lyricsStatus, setLyricsStatus] = useState("Lyrics can be generated locally on compatible Android browsers.");
  const [generator, setGenerator] = useState<Generator | null>(null);
  const ace = runner("hf-ace-step");
  const rvc = runner("hf-rvc");
  const seed = runner("hf-seed-vc");
  const clone = runner("hf-qwen3-tts");
  const image = runner("hf-z-image");
  const video = runner("hf-wan-s2v");
  const videoFallback = runner("hf-ltx-studio");
  const stems = runner("hf-demucs");

  useEffect(() => {
    setBrief(localStorage.getItem("lrbgs-song-brief") || "");
    setLyrics(localStorage.getItem("lrbgs-lyrics") || "");
  }, []);

  const songPrompt = useMemo(
    () =>
      `${brief.trim() || "Create an original song"}\nLength: ${seconds}s\nLyrics:\n${lyrics.trim() || "Write suitable original lyrics."}`,
    [brief, lyrics, seconds],
  );

  const loadLyricsModel = async () => {
    if (generator) return generator;
    setLyricsStatus("Loading the free local lyrics brain… first load may be large.");
    const dynamicImport = new Function("url", "return import(url)") as (
      url: string,
    ) => Promise<TransformersModule>;
    const lib = await dynamicImport(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0",
    );
    const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
    const model = await lib.pipeline(
      "text-generation",
      "onnx-community/Qwen3-0.6B-ONNX",
      { dtype: hasGpu ? "q4f16" : "q4", device: hasGpu ? "webgpu" : "wasm" },
    );
    const loaded = model as Generator;
    setGenerator(loaded);
    return loaded;
  };

  const generateLyrics = async () => {
    setLyricsBusy(true);
    try {
      const model = await loadLyricsModel();
      const prompt = `Write completely original song lyrics for this brief: ${brief.trim() || "an emotional modern song"}. Return only the lyrics, with clear section labels such as [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus]. Make the writing singable, memorable, specific and non-generic. Do not explain your choices.`;
      const output = await model(
        [
          {
            role: "system",
            content: "You are a professional songwriter. Create original lyrics only. Never imitate a living artist or quote existing lyrics.",
          },
          { role: "user", content: prompt },
        ],
        { max_new_tokens: 700, temperature: 0.9, do_sample: true, return_full_text: false },
      );
      const text = generatedText(output).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (!text) throw new Error("The local lyrics model returned no text.");
      setLyrics(text);
      localStorage.setItem("lrbgs-lyrics", text);
      setLyricsStatus("Lyrics generated locally and saved in this browser.");
    } catch (error) {
      setLyricsStatus(
        error instanceof Error
          ? `Local lyrics generation could not start: ${error.message}`
          : "Local lyrics generation could not start on this device.",
      );
    } finally {
      setLyricsBusy(false);
    }
  };

  const launch = async (url: string, text?: string) => {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        // Clipboard permissions are optional; the real engine still opens.
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const save = () => {
    localStorage.setItem("lrbgs-song-brief", brief);
    localStorage.setItem("lrbgs-lyrics", lyrics);
  };

  return (
    <Panel
      eyebrow="Free Core"
      title="Create for real — no paid API"
      icon={<Music2 className="size-5" />}
      defaultOpen
    >
      <p className="text-sm text-muted-foreground">
        The Studio prepares the job and sends you to a real open engine for heavyweight generation.
        Lightweight lyrics generation can run directly in the browser.
      </p>

      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={4}
        placeholder="Describe the song: genre, mood, tempo, instruments, vocal character, structure..."
        className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="rounded-xl border border-border/70 bg-background/45 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-display text-sm font-semibold">Lyrics</span>
          </div>
          <StudioButton variant="ghost" onClick={() => void generateLyrics()} disabled={lyricsBusy}>
            {lyricsBusy ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
            {lyricsBusy ? "Writing…" : "Generate lyrics"}
          </StudioButton>
        </div>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={9}
          placeholder="Generate original lyrics here, or write/paste your own."
          className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-2 text-[0.68rem] text-muted-foreground">{lyricsStatus}</p>
      </div>

      <StudioSlider
        label="Target length"
        value={seconds}
        min={30}
        max={600}
        step={5}
        unit="s"
        onChange={setSeconds}
      />

      <div className="grid grid-cols-2 gap-2">
        <StudioButton
          className="w-full"
          onClick={() => {
            save();
            void launch(ace.url, songPrompt);
          }}
        >
          <Music2 className="size-4" />
          {copied ? "Prompt copied" : "Generate full song"}
        </StudioButton>
        <StudioButton variant="ghost" className="w-full" onClick={save}>
          <Save className="size-4" /> Save locally
        </StudioButton>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <EngineButton icon={Mic2} title="Voice swap — RVC" note="Applio / RVC" onClick={() => void launch(rvc.url)} />
        <EngineButton icon={Mic2} title="Voice swap — zero-shot" note="Seed-VC" onClick={() => void launch(seed.url)} />
        <EngineButton icon={Mic2} title="Clone a voice" note="Qwen3-TTS" onClick={() => void launch(clone.url)} />
        <EngineButton icon={Image} title="Generate image" note="Z Image Turbo" onClick={() => void launch(image.url, brief)} />
        <EngineButton icon={Film} title="Generate video" note="Wan 2.2 S2V" onClick={() => void launch(video.url, brief)} />
        <EngineButton icon={Film} title="Video fallback" note="LTX Studio" onClick={() => void launch(videoFallback.url, brief)} />
        <EngineButton icon={Scissors} title="Split vocals/stems" note="Demucs" onClick={() => void launch(stems.url)} />
        <EngineButton icon={ExternalLink} title="Open song engine" note="ACE-Step 1.5" onClick={() => void launch(ace.url, songPrompt)} />
      </div>

      <Note>
        <Readout label="Song engine" value={ace.name} />
        <Readout label="Lyrics" value="Local Qwen3 browser generation" />
        <Readout label="Voice swap" value="Applio/RVC + Seed-VC" />
        <Readout label="Voice clone" value="Qwen3-TTS" />
        <Readout label="Images" value={image.name} />
        <Readout label="Video" value={video.name} />
        <Readout label="Studio API key" value="None" />
      </Note>

      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
        Heavy generation happens in the selected free public engine, so the phone does not need a
        computer. Because these are shared public services, the engine may queue or temporarily be
        unavailable; the Studio exposes a real fallback rather than showing a fake progress bar.
        Only transform voices you own or have permission to use.
      </p>
    </Panel>
  );
}

function EngineButton({
  icon: Icon,
  title,
  note,
  onClick,
}: {
  icon: typeof Music2;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-border/70 bg-background/55 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
    >
      <Icon className="size-4 text-primary" />
      <span className="mt-2 block font-display text-xs font-semibold">{title}</span>
      <span className="mt-1 block truncate text-[0.62rem] text-muted-foreground">{note}</span>
      <Copy className="mt-2 size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
