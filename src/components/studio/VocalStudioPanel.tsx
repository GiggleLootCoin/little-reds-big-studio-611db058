import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mic, Music2, Upload, WandSparkles } from "lucide-react";
import { FREE_SPACE_IDS, runGradio, runGradioAll } from "@/lib/gradio-free";
import { freeArtifactUrl } from "@/lib/free-artifact";
import { lastSuccessfulFreeSpace } from "@/lib/free-artifact-route";
import { mixVocalsWithInstrumental } from "@/lib/audio-mix";
import { Note, Panel, StudioButton } from "./ui";

type Busy = "swap" | "make" | null;
function fileUrl(file: Blob | File | null) { return file ? URL.createObjectURL(file) : null; }
function artifactFor(logical: string, fallback: string, value: unknown) { return freeArtifactUrl(value, lastSuccessfulFreeSpace(logical, fallback)); }
async function swapAndMix(sourceVocals: unknown, referenceVoice: Blob | File, instrumental: unknown, status: (s: string) => void) {
  const vocalUrl = artifactFor("vocalSeparation", "nakas/demucs_playground", sourceVocals);
  const instrumentalUrl = artifactFor("vocalSeparation", "nakas/demucs_playground", instrumental);
  if (!vocalUrl || !instrumentalUrl) throw new Error("Buddy could not identify the separated vocal and instrumental tracks.");
  status("Buddy is putting your voice onto the performance…");
  const converted = await runGradioAll(FREE_SPACE_IDS.voiceSwap, "", { source_audio: vocalUrl, source_audio_path: vocalUrl, target_audio: referenceVoice, target_audio_path: referenceVoice, diffusion_steps: 30, length_adjust: 1, inference_cfg_rate: 0.7, f0_condition: true, auto_f0_adjust: true, pitch_shift: 0 }, status);
  const convertedUrl = artifactFor("voiceSwap", "Plachta/Seed-VC", converted);
  if (!convertedUrl) throw new Error("The voice-conversion engine returned no finished vocal.");
  status("Buddy is mixing the new vocal back into the music…");
  return mixVocalsWithInstrumental(convertedUrl, instrumentalUrl);
}
export function VocalStudioPanel() {
  const [voice, setVoice] = useState<Blob | File | null>(null); const [song, setSong] = useState<File | null>(null); const [instrumental, setInstrumental] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState(""); const [brief, setBrief] = useState(""); const [busy, setBusy] = useState<Busy>(null); const [status, setStatus] = useState("Give Buddy your voice and he handles the rest.");
  const [result, setResult] = useState<string | null>(null); const [recording, setRecording] = useState(false); const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result); }, [result]);
  const recordVoice = async () => {
    if (recording) { recorderRef.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setStatus("Microphone recording is unavailable here. Upload a sample instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const supported = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = supported ? new MediaRecorder(stream, { mimeType: supported }) : new MediaRecorder(stream);
      chunksRef.current = []; recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); setVoice(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })); setRecording(false); setStatus("Your voice sample is ready. Buddy will use it only for your creation."); };
      recorderRef.current = recorder; recorder.start(); setRecording(true); setStatus("Recording your reference voice… tap again when ready.");
    } catch { setStatus("Microphone access was not available. Upload your voice sample instead."); }
  };
  const separate = async (input: File | string) => runGradioAll(FREE_SPACE_IDS.vocalSeparation, "", { audio: input }, setStatus);
  const swapSong = async () => {
    if (!voice || !song) { setStatus("Add your voice and the song you want to transform."); return; }
    setBusy("swap"); setResult(null);
    try { setStatus("Buddy is separating the singer from the music…"); const separated = await separate(song); if (separated.length < 2) throw new Error("The separation engine did not return both vocal and instrumental tracks."); const mixed = await swapAndMix(separated[0], voice, separated[1], setStatus); setResult(URL.createObjectURL(mixed)); setStatus("Finished. This is your voice on the original performance."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Buddy could not finish the vocal swap."); } finally { setBusy(null); }
  };
  const makeSong = async () => {
    if (!voice || (!lyrics.trim() && !brief.trim())) { setStatus("Add your voice and either lyrics or a song idea."); return; }
    setBusy("make"); setResult(null);
    try {
      setStatus("Buddy is generating the source performance with the live music engine…");
      const generated = await runGradio(FREE_SPACE_IDS.music, "", { lrc: lyrics.trim() || "[verse]\nA new story starts tonight\n[chorus]\nWe are alive and moving forward", text_prompt: brief.trim() || "polished contemporary song with expressive lead vocal and full backing", description: brief.trim(), lyrics: lyrics.trim(), audio_duration: 90, duration: 90, seed: -1, randomize_seed: true }, setStatus);
      const sourceSong = artifactFor("music", "ACE-Step/Ace-Step-v1.5", generated) || "";
      if (!sourceSong) throw new Error("The music engine did not return a real song artifact.");
      let backingUrl: string | null = instrumental ? URL.createObjectURL(instrumental) : null; let vocalSource: unknown = sourceSong;
      if (!backingUrl) { setStatus("Buddy is separating the generated singer from the backing…"); const separated = await separate(sourceSong); if (separated.length < 2) throw new Error("Buddy could not separate the generated vocal performance."); vocalSource = separated[0]; backingUrl = artifactFor("vocalSeparation", "nakas/demucs_playground", separated[1]); }
      if (!backingUrl) throw new Error("No backing track was available for the final mix.");
      const mixed = await swapAndMix(vocalSource, voice, backingUrl, setStatus); setResult(URL.createObjectURL(mixed)); setStatus("Finished. Your voice is now the lead singer on the new song.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Buddy could not finish the song."); } finally { setBusy(null); }
  };
  const voicePreview = fileUrl(voice); const disabled = busy !== null;
  return <Panel eyebrow="VOCALS • YOUR VOICE" title="Make the song yours" icon={<Music2 className="size-5" />} defaultOpen>
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Mic className="size-5" /></span><div><h3 className="font-display font-black">One voice sample. Buddy does the technical work.</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Record yourself or upload a sample you own. Buddy handles separation, voice conversion and the final mix.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><StudioButton onClick={() => void recordVoice()} disabled={disabled}>{recording ? <LoaderCircle className="size-4 animate-spin" /> : <Mic className="size-4" />}{recording ? "Stop recording" : "Record my voice"}</StudioButton><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold"><Upload className="size-4" /> Upload voice sample<input type="file" accept="audio/*" className="sr-only" disabled={disabled} onChange={(e) => setVoice(e.target.files?.[0] ?? null)} /></label></div>{voicePreview && <audio controls src={voicePreview} className="mt-3 w-full" />}</div>
    <section className="rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">01</span><div><h3 className="font-display font-black">Put your voice on any song</h3><p className="text-xs text-muted-foreground">Upload a song. Buddy removes the original singer, converts the performance and returns a finished track.</p></div></div><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm"><Upload className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate">{song?.name ?? "Choose the song to transform"}</span><input type="file" accept="audio/*" className="sr-only" disabled={disabled} onChange={(e) => setSong(e.target.files?.[0] ?? null)} /></label><StudioButton className="mt-3 w-full" onClick={() => void swapSong()} disabled={disabled || !voice || !song}>{busy === "swap" ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}{busy === "swap" ? "Buddy is doing the whole swap…" : "Make me the singer"}</StudioButton></section>
    <section className="rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">02</span><div><h3 className="font-display font-black">Create a new song with my voice</h3><p className="text-xs text-muted-foreground">Give Buddy lyrics or an idea. Add an instrumental if you already have one.</p></div></div><textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={5} placeholder="Paste or write lyrics here…" className="mt-4 w-full rounded-xl border border-border bg-background/70 p-3 text-sm" disabled={disabled} /><input value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Optional: describe genre, mood and feel…" className="mt-2 w-full rounded-xl border border-border bg-background/70 p-3 text-sm" disabled={disabled} /><label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm"><Upload className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate">{instrumental?.name ?? "Optional instrumental / backing track"}</span><input type="file" accept="audio/*" className="sr-only" disabled={disabled} onChange={(e) => setInstrumental(e.target.files?.[0] ?? null)} /></label><StudioButton className="mt-3 w-full" onClick={() => void makeSong()} disabled={disabled || !voice || (!lyrics.trim() && !brief.trim())}>{busy === "make" ? <LoaderCircle className="size-4 animate-spin" /> : <Music2 className="size-4" />}{busy === "make" ? "Buddy is creating your song…" : "Create my song"}</StudioButton></section>
    {result && <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-2 font-display font-black"><CheckCircle2 className="size-5 text-primary" /> Finished</div><audio controls src={result} className="mt-3 w-full" /><a href={result} download="little-reds-big-studio-my-voice-song.wav" className="mt-3 inline-flex text-xs font-semibold text-primary">Save finished song</a></div>}
    <p aria-live="polite" className="text-xs text-muted-foreground">{status}</p><Note>Buddy automatically chooses live free public engines. Only use voice samples and songs you own or are authorized to transform.</Note>
  </Panel>;
}
