import { useEffect, useMemo, useRef, useState } from "react";
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
import { runPluginJob } from "@/lib/plugins.functions";
import { signedUrl, uploadToStudio } from "@/lib/media";
import { setStudio, useStudio } from "@/lib/studio-store";

/* 3 — Honest Critiquer AI Song Coach */
export function CoachPanel() {
  const { user } = useAuth();
  const studio = useStudio();
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
      <TextArea
        label="Lyrics / structure"
        rows={4}
        value={lyrics || studio.lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Paste your lyrics or song map..."
      />
      <TextArea label="Producer notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What are you unsure about?" />
      <StudioSlider label="Brutal honesty" value={honesty} onChange={setHonesty} unit="%" />
      <StudioSlider label="Analysis depth" value={depth} onChange={setDepth} unit="%" />
      {!user && <SignInPrompt />}
      <StudioButton
        className="w-full"
        disabled={!user || loading}
        onClick={() =>
          void run(async () => {
            const r = await critiqueSong({
              data: { title, genre, lyrics: lyrics || studio.lyrics, notes, honesty, depth },
            });
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
const STEM_NAMES = ["vocals", "drums", "bass", "other"];

export function LabPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [levels, setLevels] = useState([82, 76, 71, 68]);
  const [muted, setMuted] = useState([false, false, false, false]);
  const [stems, setStems] = useState<string[]>([]);
  const [engine, setEngine] = useState<string | null>(null);
  const { loading, error, run } = useAsyncAction<null>();
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);

  useEffect(() => {
    audioRefs.current.forEach((el, i) => {
      if (el) {
        el.volume = muted[i] ? 0 : levels[i] / 100;
      }
    });
  }, [levels, muted, stems]);

  const separate = () =>
    void run(async () => {
      if (!studio.audioUrl) throw new Error("Upload a track in Module 08 first.");
      const r = await runPluginJob({
        data: { capability: "stems", payload: { audio: studio.audioUrl } },
      });
      setEngine(r.plugin);
      setStems(r.media.filter((m) => /\.(mp3|wav|flac|m4a)(\?|$)/i.test(m)).slice(0, 4));
      return null;
    });

  return (
    <Panel eyebrow="Module 04" title="Red'sLab Multi-Track & Stem Studio" icon={<Waves className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Multi-track mixing, waveform inspection and real four-way neural demixing — vocals, drums,
        bass, instruments — routed through the best free demixing plugin available.
      </p>
      {studio.audioUrl ? (
        <div className="rounded-xl border border-border bg-background/50 p-3">
          <div className="mb-2 font-display text-xs text-primary">Session track</div>
          <audio controls src={studio.audioUrl} className="w-full" />
        </div>
      ) : (
        <Note>No session track yet — upload audio in Module 08 and it lands here automatically.</Note>
      )}

      <div className="space-y-3">
        {STEM_NAMES.map((name, i) => (
          <div key={name} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm capitalize">{name}</span>
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
            {stems[i] && (
              <audio
                ref={(el) => {
                  audioRefs.current[i] = el;
                }}
                controls
                src={stems[i]}
                className="mb-2 w-full"
              />
            )}
            <StudioSlider
              label="Level"
              value={levels[i]}
              onChange={(v) => setLevels((l) => l.map((old, idx) => (idx === i ? v : old)))}
              unit="%"
            />
          </div>
        ))}
      </div>
      {!user && <SignInPrompt />}
      <StudioButton className="w-full" disabled={!user || loading} onClick={separate}>
        {loading ? "Demixing…" : "Separate stems"}
      </StudioButton>
      {loading && <Spinner label="Neural demixing in progress — this can take a couple of minutes." />}
      {error && <ErrorNote message={error} />}
      {engine && stems.length > 0 && <Readout label="Demixed by" value={engine} />}
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
  const studio = useStudio();
  const q = studio.qrange;
  const set = (patch: Partial<typeof q>) => setStudio({ qrange: { ...q, ...patch } });
  const [applied, setApplied] = useState(false);

  return (
    <Panel eyebrow="Module 05" title="Red's QRange" icon={<SlidersHorizontal className="size-5" />} defaultOpen>
      <p className="text-sm text-muted-foreground">
        The signature range engine. Preset to perfection, adjustable everywhere — every other module
        reads these values live.
      </p>
      <StudioSlider label="Q range" value={q.range} onChange={(v) => set({ range: v })} />
      <StudioSlider label="Harmonic warmth" value={q.warmth} onChange={(v) => set({ warmth: v })} />
      <StudioSlider label="Bus glue" value={q.glue} onChange={(v) => set({ glue: v })} />
      <StudioSlider
        label="True-peak ceiling"
        value={q.ceiling}
        min={-3}
        max={0}
        step={0.1}
        unit=" dB"
        onChange={(v) => set({ ceiling: v })}
      />
      <div className="flex flex-wrap gap-2">
        <Chip>Preset: Radio-Ready</Chip>
        <Chip>432Hz aligned</Chip>
        <Chip>Base-12 grid</Chip>
      </div>
      <StudioButton
        className="w-full"
        onClick={() => {
          setApplied(true);
          setTimeout(() => setApplied(false), 1800);
        }}
      >
        {applied ? "QRange applied across the studio ✔" : "Apply QRange to session"}
      </StudioButton>
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
  const studio = useStudio();
  const active = studio.seats.length ? studio.seats : COUNCIL;

  useEffect(() => {
    if (studio.seats.length === 0) setStudio({ seats: COUNCIL });
  }, [studio.seats.length]);

  return (
    <Panel eyebrow="Module 06" title="The Council of 9 AI Panel" icon={<Bot className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Nine specialist seats deliberate on every creative decision — chat, lyrics and storyboarding
        all draw from the seats you keep active here.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {COUNCIL.map((seat, i) => {
          const on = active.includes(seat);
          return (
            <button
              key={seat}
              type="button"
              onClick={() =>
                setStudio({ seats: on ? active.filter((s) => s !== seat) : [...active, seat] })
              }
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
  const { user } = useAuth();
  const studio = useStudio();
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("cinematic pop");
  const [mood, setMood] = useState("triumphant");
  const [rhyme, setRhyme] = useState(80);
  const [explicit, setExplicit] = useState(false);
  const lyricsAction = useAsyncAction<string>();

  const [voiceText, setVoiceText] = useState("");
  const [speed, setSpeed] = useState(100);
  const voiceAction = useAsyncAction<{ url: string; engine: string }>();

  return (
    <Panel eyebrow="Module 07" title="Elite Lyrics & Voice Cloning" icon={<Mic2 className="size-5" />}>
      <TextArea
        label="Theme / hook"
        rows={3}
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        placeholder="Song theme, story, or a hook you already have..."
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
        <Field label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} />
      </div>
      <StudioSlider label="Rhyme density" value={rhyme} onChange={setRhyme} unit="%" />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} />
        Allow explicit language
      </label>
      {!user && <SignInPrompt />}
      <StudioButton
        className="w-full"
        disabled={!user || lyricsAction.loading || !theme.trim()}
        onClick={() =>
          void lyricsAction.run(async () => {
            const r = await writeLyrics({ data: { theme, genre, mood, explicit, rhyme } });
            setStudio({ lyrics: r.lyrics });
            return r.lyrics;
          })
        }
      >
        {lyricsAction.loading ? "The Council is writing…" : "Write lyrics with the Council"}
      </StudioButton>
      {lyricsAction.loading && <Spinner label="Drafting verses, hooks and performance notes…" />}
      {lyricsAction.error && <ErrorNote message={lyricsAction.error} />}
      {lyricsAction.result && <AiOutput text={lyricsAction.result} label="Copy lyrics" />}

      <div className="drip-divider my-2" />
      <h3 className="font-display text-sm">Vocal clone & swap</h3>
      <p className="text-xs text-muted-foreground">
        Uses the best free voice plugin available (OpenVoice / Fish Speech). Upload a reference vocal
        in Module 08 to clone its timbre.
      </p>
      <TextArea
        label="Line to sing / speak"
        rows={2}
        value={voiceText}
        onChange={(e) => setVoiceText(e.target.value)}
        placeholder="Paste a lyric line..."
      />
      <StudioSlider label="Delivery speed" value={speed} min={50} max={150} unit="%" onChange={setSpeed} />
      <StudioButton
        className="w-full"
        disabled={!user || voiceAction.loading || !voiceText.trim()}
        onClick={() =>
          void voiceAction.run(async () => {
            const r = await runPluginJob({
              data: {
                capability: "voice",
                payload: {
                  text: voiceText,
                  reference: studio.audioUrl ?? undefined,
                  speed: speed / 100,
                },
              },
            });
            const url = r.media[0];
            if (!url) throw new Error("The voice model returned no audio.");
            return { url, engine: r.plugin };
          })
        }
      >
        {voiceAction.loading ? "Cloning voice…" : "Render vocal"}
      </StudioButton>
      {voiceAction.loading && <Spinner label="Synthesising the vocal take…" />}
      {voiceAction.error && <ErrorNote message={voiceAction.error} />}
      {voiceAction.result && (
        <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <Readout label="Rendered by" value={voiceAction.result.engine} />
          <audio controls src={voiceAction.result.url} className="w-full" />
        </div>
      )}
      <Note>Quality guardrails stay locked at optimum regardless of slider position.</Note>
    </Panel>
  );
}

/* 8 — Uploads */
type Uploaded = { name: string; path: string; url: string | null; kind: "audio" | "image" };

export function UploadPanel() {
  const { user } = useAuth();
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const add = async (list: FileList | null) => {
    if (!list || !user) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(list)) {
        const kind: "audio" | "image" = file.type.startsWith("audio") ? "audio" : "image";
        const path = await uploadToStudio(user.id, kind, file);
        const url = await signedUrl(path);
        setFiles((f) => [...f, { name: file.name, path, url, kind }]);
        if (kind === "audio") setStudio({ audioPath: path, audioUrl: url, audioName: file.name });
        else setStudio({ referencePath: path, referenceUrl: url });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel eyebrow="Module 08" title="Audio, Voice & File Uploads" icon={<UploadCloud className="size-5" />}>
      {!user && <SignInPrompt />}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void add(e.dataTransfer.files);
        }}
        onClick={() => user && inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          drag ? "border-primary bg-primary/10" : "border-border bg-background/40"
        } ${user ? "" : "opacity-50"}`}
      >
        <UploadCloud className="mx-auto mb-2 size-7 text-primary" />
        <p className="font-display text-sm">Drop audio or reference imagery</p>
        <p className="text-xs text-muted-foreground">WAV · MP3 · PNG · JPG — stored privately in your account</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => void add(e.target.files)}
          accept="audio/*,image/*"
        />
      </div>
      {busy && <Spinner label="Uploading to your private studio storage…" />}
      {error && <ErrorNote message={error} />}
      {files.length > 0 && (
        <ul className="space-y-2 text-xs text-muted-foreground">
          {files.map((f) => (
            <li key={f.path} className="space-y-2 rounded-lg bg-background/50 px-3 py-2">
              <span className="flex items-center gap-2">
                <AudioLines className="size-4 text-primary" /> {f.name}
              </span>
              {f.kind === "audio" && f.url && <audio controls src={f.url} className="w-full" />}
              {f.kind === "image" && f.url && (
                <img src={f.url} alt={f.name} className="max-h-40 rounded-lg object-cover" />
              )}
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
type Msg = { role: "user" | "assistant"; content: string };

export function ChatPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [input, setInput] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...log, { role: "user", content: text }];
    setLog(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const r = await councilChat({ data: { messages: next.slice(-20), seats: studio.seats } });
      setLog([...next, { role: "assistant", content: r.reply }]);
      setStudio({ direction: `${studio.direction}\n${text}\n${r.reply}`.trim().slice(-4000) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel eyebrow="Module 09" title="AI Chat & Brainstorming" icon={<Music4 className="size-5" />}>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {log.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Talk direction, mood and references. Everything discussed here feeds the storyboard.
          </p>
        )}
        {log.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto crimson-gloss text-primary-foreground"
                : "border border-border bg-background/60"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <Spinner label="The Council is deliberating…" />}
      </div>
      {!user && <SignInPrompt />}
      {error && <ErrorNote message={error} />}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
          placeholder="Message the Council..."
          disabled={!user}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <StudioButton onClick={() => void send()} disabled={!user || busy}>
          Send
        </StudioButton>
      </div>
    </Panel>
  );
}

/* 10 — Storyboard */
export function StoryboardPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [scenes, setScenes] = useState(10);
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(180);
  const [direction, setDirection] = useState("");
  const { loading, error, result, run } = useAsyncAction<string>();

  return (
    <Panel eyebrow="Module 10" title="Automated Storyboarding" icon={<Clapperboard className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Beat-mapped, scene-by-scene shot scripts built from your audio and locked chat direction —
        each scene ships with a ready-to-render video prompt.
      </p>
      <Field
        label="Track title"
        value={studio.title}
        onChange={(e) => setStudio({ title: e.target.value })}
        placeholder="Crimson Lullaby"
      />
      <TextArea
        label="Creative direction"
        rows={3}
        value={direction || studio.direction}
        onChange={(e) => setDirection(e.target.value)}
        placeholder="Locked direction from the Council chat, or type your own..."
      />
      <StudioSlider label="Scenes" value={scenes} min={3} max={24} onChange={setScenes} />
      <StudioSlider label="Tempo" value={bpm} min={40} max={220} unit=" BPM" onChange={setBpm} />
      <StudioSlider label="Track length" value={duration} min={30} max={600} step={5} unit="s" onChange={setDuration} />
      {!user && <SignInPrompt />}
      <StudioButton
        className="w-full"
        disabled={!user || loading}
        onClick={() =>
          void run(async () => {
            const text = (direction || studio.direction).trim();
            if (!text) throw new Error("Add creative direction, or brainstorm in Module 09 first.");
            const r = await buildStoryboard({
              data: { title: studio.title, direction: text, bpm, durationSec: duration, scenes },
            });
            setStudio({ storyboard: r.storyboard, bpm });
            return r.storyboard;
          })
        }
      >
        {loading ? "Mapping to the beat grid…" : "Generate storyboard"}
      </StudioButton>
      {loading && <Spinner label="Building shot-by-shot coverage…" />}
      {error && <ErrorNote message={error} />}
      {result && <AiOutput text={result} label="Copy storyboard" />}
    </Panel>
  );
}

/* 11 — Video generation */
function extractScenePrompts(storyboard: string) {
  const prompts = storyboard
    .split(/\n(?=### )/)
    .map((block) => {
      const match = block.match(/\*\*Video prompt:\*\*\s*([\s\S]*?)(?:\n\s*\n|$)/i);
      const heading = block.match(/^###\s*(.+)/)?.[1]?.trim() ?? "Scene";
      return match ? { heading, prompt: match[1].replace(/\s+/g, " ").trim() } : null;
    })
    .filter(Boolean) as Array<{ heading: string; prompt: string }>;
  return prompts;
}

export function VideoPanel() {
  const { user } = useAuth();
  const studio = useStudio();
  const [length, setLength] = useState(5);
  const [manual, setManual] = useState("");
  const [clips, setClips] = useState<Array<{ heading: string; url: string; engine: string }>>([]);
  const { loading, error, run } = useAsyncAction<null>();
  const scenes = useMemo(() => extractScenePrompts(studio.storyboard), [studio.storyboard]);

  const render = (items: Array<{ heading: string; prompt: string }>) =>
    void run(async () => {
      for (const item of items) {
        const r = await runPluginJob({
          data: {
            capability: "video",
            payload: {
              prompt: item.prompt,
              image: studio.referenceUrl ?? undefined,
              seconds: length,
            },
          },
        });
        const url = r.media.find((m) => /\.(mp4|webm|mov)(\?|$)/i.test(m)) ?? r.media[0];
        if (url) setClips((c) => [...c, { heading: item.heading, url, engine: r.plugin }]);
      }
      return null;
    });

  return (
    <Panel eyebrow="Module 11" title="Video Generation" icon={<Film className="size-5" />}>
      <p className="text-sm text-muted-foreground">
        Renders through the plugin system — Wan, Hunyuan Video, LTX Video or CogVideoX, whichever is
        scoring best this week. Manage them in Module 18.
      </p>
      <StudioSlider label="Clip length" value={length} min={3} max={15} unit="s" onChange={setLength} />
      <TextArea
        label="One-off shot prompt"
        rows={2}
        value={manual}
        onChange={(e) => setManual(e.target.value)}
        placeholder="Crimson-lit close up, slow dolly in, embers drifting..."
      />
      {!user && <SignInPrompt />}
      <div className="grid grid-cols-2 gap-2">
        <StudioButton
          variant="ghost"
          disabled={!user || loading || !manual.trim()}
          onClick={() => render([{ heading: "Single shot", prompt: manual }])}
        >
          Render shot
        </StudioButton>
        <StudioButton
          className="w-full"
          disabled={!user || loading || scenes.length === 0}
          onClick={() => render(scenes)}
        >
          Render {scenes.length || ""} scenes
        </StudioButton>
      </div>
      {scenes.length === 0 && <Note>Generate a storyboard in Module 10 to unlock batch rendering.</Note>}
      {loading && <Spinner label="Rendering clips — video models take a few minutes per shot." />}
      {error && <ErrorNote message={error} />}
      {clips.map((c, i) => (
        <div key={`${c.url}-${i}`} className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <div className="font-display text-xs text-primary">{c.heading}</div>
          <video controls src={c.url} className="w-full rounded-lg" />
          <Readout label="Rendered by" value={c.engine} />
        </div>
      ))}
    </Panel>
  );
}
