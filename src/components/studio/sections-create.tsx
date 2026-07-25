import { useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Bot,
  Brain,
  Clapperboard,
  Film,
  Mic2,
  Music4,
  SlidersHorizontal,
  UploadCloud,
  Waves,
} from "lucide-react";
import { Chip, Note, Panel, Readout, StudioButton, StudioSlider } from "./ui";
import { AiOutput, ErrorNote, Field, SignInPrompt, Spinner, TextArea, useAsyncAction } from "./AiOutput";
import { useAuth } from "@/hooks/use-auth";
import { buildStoryboard, councilChat, critiqueSong, writeLyrics } from "@/lib/studio.functions";
import { uploadToStudio } from "@/lib/media";

/* 3 — Honest Critiquer AI Song Coach */
export function CoachPanel() {
  const { user } = useAuth();
  const [honesty, setHonesty] = useState(85);
  const [depth, setDepth] = useState(70);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [notes, setNotes] = useState("");
  const { loading, error, result, run } = useAsyncAction<string>();

  return (
    <Panel eyebrow="Module 03" title="Honest Critiquer AI Song Coach" icon={<Brain className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        A brutally honest pass over melody, arrangement, mix balance and lyric density — then ranked,
        top-tier alternatives you can use straight away.
      </p>
      <Field label="Track title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Crimson Lullaby" />
      <Field label="Genre / reference" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="dark pop, Billie-adjacent" />
      <TextArea label="Lyrics / structure" rows={4} value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Paste your lyrics or song map..." />
      <TextArea label="Producer notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What are you unsure about?" />
      <StudioSlider label="Brutal honesty" value={honesty} onChange={setHonesty} unit="%" />
      <StudioSlider label="Analysis depth" value={depth} onChange={setDepth} unit="%" />
      {!user && <SignInPrompt />}
      <StudioButton
        className="w-full"
        disabled={!user || loading}
        onClick={() =>
          void run(async () => {
            const r = await critiqueSong({ data: { title, genre, lyrics, notes, honesty, depth } });
            return r.critique;
          })
        }
      >
        {loading ? "Listening…" : "Run critique pass"}
      </StudioButton>
      {loading && <Spinner label="The Honest Critiquer is working through your track…" />}
      {error && <ErrorNote message={error} />}
      {result && <AiOutput text={result} label="Copy critique" />}
    </Panel>
  );
}


/* 4 — Red'sLab Multi-Track & Stem Studio */
const TRACKS = [
  { name: "Vocals", level: 82 },
  { name: "Drums", level: 76 },
  { name: "Bass", level: 71 },
  { name: "Instruments", level: 68 },
];

export function LabPanel() {
  const [levels, setLevels] = useState(TRACKS.map((t) => t.level));
  const [muted, setMuted] = useState<boolean[]>(TRACKS.map(() => false));

  return (
    <Panel eyebrow="Module 04" title="Red'sLab Multi-Track & Stem Studio" icon={<Waves className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Full multi-track recording, waveform inspection and four-way neural demixing — vocals,
        drums, bass, instruments. Free, always.
      </p>
      <div className="space-y-3">
        {TRACKS.map((t, i) => (
          <div key={t.name} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm">{t.name}</span>
              <button
                type="button"
                onClick={() => setMuted((m) => m.map((v, idx) => (idx === i ? !v : v)))}
                className={`rounded-lg border border-border px-2.5 py-1 text-xs transition-colors ${
                  muted[i] ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {muted[i] ? "Muted" : "Live"}
              </button>
            </div>
            <Waveform seed={i} dim={muted[i]} />
            <StudioSlider
              label="Level"
              value={levels[i]}
              onChange={(v) => setLevels((l) => l.map((old, idx) => (idx === i ? v : old)))}
              unit="%"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StudioButton variant="ghost">Add track</StudioButton>
        <StudioButton>Separate stems</StudioButton>
      </div>
    </Panel>
  );
}

function Waveform({ seed, dim }: { seed: number; dim?: boolean }) {
  const bars = useMemo(
    () => Array.from({ length: 48 }, (_, i) => 20 + ((i * 7 + seed * 13) % 80)),
    [seed],
  );
  return (
    <div className={`mb-3 flex h-12 items-end gap-[2px] ${dim ? "opacity-30" : ""}`}>
      {bars.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm bg-primary/70"
          style={{ height: `${h}%`, boxShadow: "0 0 6px oklch(0.58 0.24 26 / 50%)" }}
        />
      ))}
    </div>
  );
}

/* 5 — Red's QRange */
export function QRangePanel() {
  const [range, setRange] = useState(64);
  const [warmth, setWarmth] = useState(58);
  const [glue, setGlue] = useState(72);
  const [ceiling, setCeiling] = useState(-0.3);
  return (
    <Panel
      eyebrow="Module 05"
      title="Red's QRange"
      icon={<SlidersHorizontal className="size-5" />}
      defaultOpen
    >
      <p className="text-sm text-muted-foreground">
        The signature range engine. Preset to perfection, adjustable everywhere — it can be applied
        from any other module in the studio.
      </p>
      <StudioSlider label="Q range" value={range} onChange={setRange} />
      <StudioSlider label="Harmonic warmth" value={warmth} onChange={setWarmth} />
      <StudioSlider label="Bus glue" value={glue} onChange={setGlue} />
      <StudioSlider label="True-peak ceiling" value={ceiling} min={-3} max={0} step={0.1} unit=" dB" onChange={setCeiling} />
      <div className="flex flex-wrap gap-2">
        <Chip>Preset: Radio-Ready</Chip>
        <Chip>432Hz aligned</Chip>
        <Chip>Base-12 grid</Chip>
      </div>
      <StudioButton className="w-full">Apply QRange to session</StudioButton>
    </Panel>
  );
}

/* 6 — Council of 9 */
const COUNCIL = [
  "Lead Composer",
  "Lyricist",
  "Mix Engineer",
  "Visual Director",
  "Storyboard Artist",
  "Colorist",
  "Editor",
  "Critic",
  "Producer",
];

export function CouncilPanel() {
  const [active, setActive] = useState<string[]>(COUNCIL);
  return (
    <Panel eyebrow="Module 06" title="The Council of 9 AI Panel" icon={<Bot className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Nine specialist seats deliberate on every creative decision — chat, visual direction and
        storyboarding all draw from the same council verdict.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {COUNCIL.map((seat, i) => {
          const on = active.includes(seat);
          return (
            <button
              key={seat}
              type="button"
              onClick={() => setActive((a) => (on ? a.filter((s) => s !== seat) : [...a, seat]))}
              className={`rounded-xl border p-2 text-center text-[0.7rem] leading-tight transition-all ${
                on
                  ? "crimson-gloss border-transparent text-primary-foreground"
                  : "border-border bg-background/50 text-muted-foreground"
              }`}
            >
              <span className="block font-display text-[0.6rem] opacity-70">Seat {i + 1}</span>
              {seat}
            </button>
          );
        })}
      </div>
      <Readout label="Council quorum" value={`${active.length} of 9 seated`} />
    </Panel>
  );
}

/* 7 — Lyrics + voice clone */
export function LyricsPanel() {
  const [theme, setTheme] = useState("");
  const [emotion, setEmotion] = useState(76);
  const [similarity, setSimilarity] = useState(92);
  return (
    <Panel eyebrow="Module 07" title="Elite Lyrics & Voice Cloning" icon={<Mic2 className="size-5" />}>
      <textarea
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        rows={3}
        placeholder="Song theme, story, or a hook you already have..."
        className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />
      <StudioSlider label="Emotional resonance" value={emotion} onChange={setEmotion} unit="%" />
      <StudioButton className="w-full">Write lyrics with the Council</StudioButton>
      <div className="drip-divider my-2" />
      <h3 className="font-display text-sm">Vocal clone & swap</h3>
      <StudioSlider label="Timbre similarity" value={similarity} onChange={setSimilarity} unit="%" />
      <div className="grid grid-cols-2 gap-2">
        <StudioButton variant="ghost">Train voice</StudioButton>
        <StudioButton variant="ghost">Swap vocal</StudioButton>
      </div>
      <Note>Quality guardrails stay locked at optimum regardless of slider position.</Note>
    </Panel>
  );
}

/* 8 — Uploads */
export function UploadPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list).map((x) => x.name)]);
  };

  return (
    <Panel eyebrow="Module 08" title="Audio, Voice & File Uploads" icon={<UploadCloud className="size-5" />}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          drag ? "border-primary bg-primary/10" : "border-border bg-background/40"
        }`}
      >
        <UploadCloud className="mx-auto mb-2 size-7 text-primary" />
        <p className="font-display text-sm">Drop audio or reference imagery</p>
        <p className="text-xs text-muted-foreground">WAV · MP3 · PNG · JPG</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => add(e.target.files)}
          accept="audio/*,image/*"
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {files.map((f, i) => (
            <li key={`${f}-${i}`} className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
              <AudioLines className="size-4 text-primary" /> {f}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Readout label="Algorithm" value="RMVPE" />
        <Readout label="Sample rate" value="40,000 Hz" />
        <Readout label="Epochs" value="250" />
      </div>
    </Panel>
  );
}

/* 9 — Chat */
type Msg = { role: "you" | "council"; text: string };

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<Msg[]>([]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setLog((l) => [
      ...l,
      { role: "you", text },
      {
        role: "council",
        text: "Logged for the Council. Connect the studio backend to get live creative replies here.",
      },
    ]);
    setInput("");
  };

  return (
    <Panel eyebrow="Module 09" title="AI Chat & Brainstorming" icon={<Music4 className="size-5" />}>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {log.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Talk direction, mood and references. Everything locked here feeds the storyboard.
          </p>
        )}
        {log.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "you"
                ? "ml-auto crimson-gloss text-primary-foreground"
                : "border border-border bg-background/60"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message the Council..."
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <StudioButton onClick={send}>Send</StudioButton>
      </div>
    </Panel>
  );
}

/* 10 — Storyboard */
export function StoryboardPanel() {
  const [scenes, setScenes] = useState(8);
  return (
    <Panel eyebrow="Module 10" title="Automated Storyboarding" icon={<Clapperboard className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Beat-mapped, scene-by-scene shot scripts built from your audio and locked chat direction.
      </p>
      <StudioSlider label="Scenes" value={scenes} min={4} max={24} onChange={setScenes} />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: Math.min(scenes, 6) }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="font-display text-xs text-primary">Scene {i + 1}</div>
            <div className="text-xs text-muted-foreground">Awaiting beat map</div>
          </div>
        ))}
      </div>
      <StudioButton className="w-full">Generate storyboard</StudioButton>
    </Panel>
  );
}

/* 11 — Video generation */
export function VideoPanel() {
  const [model, setModel] = useState("Luma Dream Machine");
  const [length, setLength] = useState(10);
  return (
    <Panel eyebrow="Module 11" title="Video Generation" icon={<Film className="size-5" />}>
      <div className="grid grid-cols-3 gap-2">
        {["Luma Dream Machine", "Runway Gen-3", "Kling AI"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModel(m)}
            className={`rounded-xl border p-2 text-[0.7rem] leading-tight transition-all ${
              model === m
                ? "crimson-gloss border-transparent text-primary-foreground"
                : "border-border bg-background/50 text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <StudioSlider label="Clip length" value={length} min={4} max={30} unit="s" onChange={setLength} />
      <StudioButton className="w-full">Render clips from storyboard</StudioButton>
      <Note>Render jobs dispatch once the video model keys are connected to the studio backend.</Note>
    </Panel>
  );
}
