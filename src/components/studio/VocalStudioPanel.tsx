import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mic, Music2, Upload, WandSparkles } from "lucide-react";
import { FREE_SPACE_IDS, freeFile, outputUrl, runGradio, runGradioAll } from "@/lib/gradio-free";
import { mixVocalsWithInstrumental } from "@/lib/audio-mix";
import { Note, Panel, StudioButton } from "./ui";

type Busy = "swap" | "make" | null;

function fileUrl(file: Blob | File | null) {
  return file ? URL.createObjectURL(file) : null;
}

function firstAudio(outputs: unknown[]) {
  return outputs.map(outputUrl).find(Boolean) ?? null;
}

async function swapAndMix(
  sourceVocals: unknown,
  referenceVoice: Blob | File,
  instrumental: unknown,
  status: (s: string) => void,
) {
  const vocalUrl = outputUrl(sourceVocals);
  const instrumentalUrl = outputUrl(instrumental);
  if (!vocalUrl || !instrumentalUrl)
    throw new Error("Buddy could not identify the separated vocal and instrumental tracks.");
  status("Buddy is putting your voice onto the performance…");
  const converted = await runGradioAll(
    FREE_SPACE_IDS.voiceSwap,
    "/convert_voice_v1_wrapper",
    {
      source_audio_path: vocalUrl,
      target_audio_path: freeFile(referenceVoice),
      diffusion_steps: 50,
      length_adjust: 1,
      inference_cfg_rate: 0.7,
      f0_condition: true,
      auto_f0_adjust: true,
      pitch_shift: 0,
      stream_output: false,
    },
    status,
  );
  const convertedUrl = firstAudio(converted);
  if (!convertedUrl) throw new Error("The voice-conversion engine returned no finished vocal.");
  status("Buddy is mixing the new vocal back into the music…");
  return mixVocalsWithInstrumental(convertedUrl, instrumentalUrl);
}

export function VocalStudioPanel() {
  const [voice, setVoice] = useState<Blob | File | null>(null);
  const [song, setSong] = useState<File | null>(null);
  const [instrumental, setInstrumental] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState("Give Buddy your voice and he handles the rest.");
  const [result, setResult] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result);
    },
    [result],
  );

  const recordVoice = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Your browser does not provide microphone recording. Upload a sample instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setVoice(blob);
        setRecording(false);
        setStatus("Your voice sample is ready. Buddy will use it only for your creation.");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus("Recording your reference voice… tap again when you have enough.");
    } catch {
      setStatus("Microphone access was not available. You can upload your voice sample instead.");
    }
  };

  const swapSong = async () => {
    if (!voice || !song) {
      setStatus("Add your voice and the song you want to transform.");
      return;
    }
    setBusy("swap");
    setResult(null);
    try {
      setStatus("Buddy is separating the singer from the music…");
      const separated = await runGradioAll(
        FREE_SPACE_IDS.vocalSeparation,
        "/predict",
        [freeFile(song)],
        setStatus,
      );
      if (separated.length < 2)
        throw new Error("The separation engine did not return both vocal and instrumental tracks.");
      const mixed = await swapAndMix(separated[0], voice, separated[1], setStatus);
      setResult(URL.createObjectURL(mixed));
      setStatus(
        "Finished. This is your voice singing the original performance over the original music.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Buddy could not finish the vocal swap.");
    } finally {
      setBusy(null);
    }
  };

  const makeSong = async () => {
    if (!voice || (!lyrics.trim() && !brief.trim())) {
      setStatus("Add your voice and either lyrics or a song idea.");
      return;
    }
    setBusy("make");
    setResult(null);
    try {
      let backing = instrumental;
      let sourceSongUrl: string | null = null;
      if (!backing) {
        setStatus("Buddy is composing a full song around your lyrics…");
        const generated = await runGradio(
          FREE_SPACE_IDS.music,
          "/create",
          {
            description: brief.trim() || "A polished modern song built around the supplied lyrics",
            lyrics: lyrics.trim(),
            seed: -1,
            community: false,
          },
          setStatus,
        );
        sourceSongUrl = outputUrl(generated);
        if (!sourceSongUrl) throw new Error("The music engine did not return a song.");
      } else {
        setStatus("Buddy is creating a singing performance for your backing track…");
        const generated = await runGradio(
          FREE_SPACE_IDS.music,
          "/create",
          {
            description: `${brief.trim() || "Create a vocal performance that fits the supplied backing track"}. Keep the arrangement singer-friendly.`,
            lyrics: lyrics.trim(),
            seed: -1,
            community: false,
          },
          setStatus,
        );
        sourceSongUrl = outputUrl(generated);
        if (!sourceSongUrl)
          throw new Error("The singing-performance engine did not return a source performance.");
      }
      setStatus("Buddy is separating the generated performance so only the singer changes…");
      const separated = await runGradioAll(
        FREE_SPACE_IDS.vocalSeparation,
        "/predict",
        [sourceSongUrl],
        setStatus,
      );
      if (separated.length < 2)
        throw new Error("Buddy could not separate the generated vocal performance.");
      const backingUrl = backing ? URL.createObjectURL(backing) : outputUrl(separated[1]);
      if (!backingUrl) throw new Error("No backing track was available for the final mix.");
      const mixed = await swapAndMix(separated[0], voice, backingUrl, setStatus);
      setResult(URL.createObjectURL(mixed));
      if (!backing && backingUrl.startsWith("blob:")) URL.revokeObjectURL(backingUrl);
      setStatus("Finished. Your voice is now the lead singer on the new song.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Buddy could not finish the song.");
    } finally {
      setBusy(null);
    }
  };

  const voicePreview = fileUrl(voice);
  const disabled = busy !== null;
  return (
    <Panel
      eyebrow="VOCALS • YOUR VOICE"
      title="Make the song yours"
      icon={<Music2 className="size-5" />}
      defaultOpen
    >
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Mic className="size-5" />
          </span>
          <div>
            <h3 className="font-display font-black">
              One voice sample. Buddy does the technical work.
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Record yourself or upload a sample you own. Buddy automatically handles separation,
              voice conversion, timing and the final mix.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <StudioButton onClick={() => void recordVoice()} disabled={disabled}>
            {recording ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Mic className="size-4" />
            )}
            {recording ? "Stop recording" : "Record my voice"}
          </StudioButton>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold hover:bg-background">
            <Upload className="size-4" /> Upload voice sample
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => setVoice(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {voicePreview && <audio controls src={voicePreview} className="mt-3 w-full" />}
      </div>

      <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            01
          </span>
          <div>
            <h3 className="font-display font-black">Put your voice on any song</h3>
            <p className="text-xs text-muted-foreground">
              Upload a song. Buddy removes the original singer, preserves the music, puts your voice
              onto the performance and returns one finished track.
            </p>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
          <Upload className="size-4 text-primary" />
          <span className="min-w-0 flex-1 truncate">
            {song?.name ?? "Choose the song to transform"}
          </span>
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => setSong(e.target.files?.[0] ?? null)}
          />
        </label>
        <StudioButton
          className="mt-3 w-full"
          onClick={() => void swapSong()}
          disabled={disabled || !voice || !song}
        >
          {busy === "swap" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <WandSparkles className="size-4" />
          )}
          {busy === "swap" ? "Buddy is doing the whole swap…" : "Make me the singer"}
        </StudioButton>
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            02
          </span>
          <div>
            <h3 className="font-display font-black">Create a new song with my voice</h3>
            <p className="text-xs text-muted-foreground">
              Give Buddy lyrics or an idea. Add an instrumental if you already have one; otherwise
              Buddy creates the backing track too.
            </p>
          </div>
        </div>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={5}
          placeholder="Paste or write lyrics here…"
          className="mt-4 w-full rounded-xl border border-border bg-background/70 p-3 text-sm"
          disabled={disabled}
        />
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Optional: describe genre, mood and feel…"
          className="mt-2 w-full rounded-xl border border-border bg-background/70 p-3 text-sm"
          disabled={disabled}
        />
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
          <Upload className="size-4 text-primary" />
          <span className="min-w-0 flex-1 truncate">
            {instrumental?.name ?? "Optional instrumental / backing track"}
          </span>
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => setInstrumental(e.target.files?.[0] ?? null)}
          />
        </label>
        <StudioButton
          className="mt-3 w-full"
          onClick={() => void makeSong()}
          disabled={disabled || !voice || (!lyrics.trim() && !brief.trim())}
        >
          {busy === "make" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Music2 className="size-4" />
          )}
          {busy === "make" ? "Buddy is creating your song…" : "Create my song"}
        </StudioButton>
      </section>

      {result && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 font-display font-black">
            <CheckCircle2 className="size-5 text-primary" /> Finished
          </div>
          <audio controls src={result} className="mt-3 w-full" />
          <a
            href={result}
            download="little-reds-big-studio-my-voice-song.wav"
            className="mt-3 inline-flex text-xs font-semibold text-primary"
          >
            Save finished song
          </a>
        </div>
      )}
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {status}
      </p>
      <Note>
        Buddy automatically chooses the best available free engine and keeps technical controls out
        of your way. Only use voice samples and songs you own or are authorized to transform.
      </Note>
    </Panel>
  );
}
