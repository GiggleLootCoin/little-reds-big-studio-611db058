import { useEffect, useState } from "react";
import {
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Mic2,
  Music2,
  Save,
  WandSparkles,
} from "lucide-react";
import {
  FREE_SPACE_IDS,
  freeFile,
  firstOutput,
  outputUrl,
  runGradio,
  runGradioAll,
} from "@/lib/gradio-free";
import { Note, Panel, StudioButton } from "./ui";

type Busy = "lyrics" | "song" | "image" | "video" | "clone" | "swap" | null;
const TIMEOUT = 180_000;
function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/https?:\/\/\S+/g, "").trim()
    : "The creation service did not return a result.";
}
async function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("The creation service timed out.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function resultUrl(value: unknown) {
  return outputUrl(value) ?? outputUrl(firstOutput(value));
}

export function FreeCreatePanel() {
  const [brief, setBrief] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState("Buddy is ready.");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [cloneUrl, setCloneUrl] = useState<string | null>(null);
  const [swapUrl, setSwapUrl] = useState<string | null>(null);
  const [videoImage, setVideoImage] = useState<File | null>(null);
  const [videoAudio, setVideoAudio] = useState<File | null>(null);
  const [referenceVoice, setReferenceVoice] = useState<File | null>(null);
  const [swapSource, setSwapSource] = useState<File | null>(null);
  useEffect(() => {
    setBrief(localStorage.getItem("lrbgs-song-brief") || "");
    setLyrics(localStorage.getItem("lrbgs-lyrics") || "");
  }, []);
  const generateLyrics = async () => {
    setBusy("lyrics");
    setStatus("Buddy is writing your lyrics…");
    try {
      const dynamicImport = new Function("url", "return import(url)") as (
        url: string,
      ) => Promise<any>;
      const lib = await withTimeout(
        dynamicImport("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0"),
        60000,
      );
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      const model: any = await withTimeout(
        lib.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", {
          dtype: hasGpu ? "q4f16" : "q4",
          device: hasGpu ? "webgpu" : "wasm",
        }),
        120000,
      );
      const result = await withTimeout(
        model(
          [
            { role: "system", content: "Write original singable lyrics. Do not quote existing lyrics or imitate living artists." },
            { role: "user", content: `Write original lyrics for ${brief.trim() || "a song about feeling loved"}. Include Verse 1, Pre-Chorus, Chorus, Verse 2, Bridge and Final Chorus.` },
          ],
          { max_new_tokens: 650, temperature: 0.9, do_sample: true, return_full_text: false },
        ),
        120000,
      );
      const first = Array.isArray(result) ? result[0] : result;
      const generated = typeof first?.generated_text === "string" ? first.generated_text : first?.generated_text?.at?.(-1)?.content;
      if (!generated) throw new Error("No lyrics were returned.");
      const clean = generated.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      setLyrics(clean);
      localStorage.setItem("lrbgs-lyrics", clean);
      setStatus("Your lyrics are ready.");
    } catch (e) {
      setStatus(`Lyrics could not be completed: ${messageOf(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const generateSong = async () => {
    setBusy("song");
    setAudioUrl(null);
    setStatus("Buddy is creating your song…");
    try {
      const lrc = lyrics.trim() || "[start]\n[verse]\nA brand new song begins tonight\n[chorus]\nWe are alive, we are alright\n[outro]";
      const result = await withTimeout(
        runGradio(
          FREE_SPACE_IDS.music,
          "/infer_music",
          {
            lrc,
            current_prompt_type: "text",
            text_prompt: brief.trim() || "polished contemporary pop, warm vocals, piano, bass, drums, uplifting",
            audio_prompt: null,
            seed: 42,
            randomize_seed: true,
            steps: 16,
            cfg_strength: 1.0,
            file_type: "wav",
            odeint_method: "euler",
          },
          setStatus,
        ),
        720_000,
      );
      const url = resultUrl(result);
      if (!url) throw new Error("The music service returned no audio file.");
      setAudioUrl(url);
      setStatus("Your song is ready.");
    } catch (e) {
      setStatus(`Song could not be completed: ${messageOf(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const generateImage = async () => {
    setBusy("image");
    setImageUrl(null);
    setStatus("Buddy is creating your artwork…");
    try {
      const result = await withTimeout(
        runGradio(FREE_SPACE_IDS.image, "/generate_image", {
          prompt: brief.trim() || "A cinematic premium album cover for an original song",
          height: 1024,
          width: 1024,
          num_inference_steps: 9,
          seed: 42,
          randomize_seed: true,
        }, setStatus),
        300_000,
      );
      const url = resultUrl(result);
      if (!url) throw new Error("The image service returned no image file.");
      setImageUrl(url);
      setStatus("Your artwork is ready.");
    } catch (e) {
      setStatus(`Artwork could not be completed: ${messageOf(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const generateVideo = async () => {
    const audio = videoAudio ?? audioUrl;
    if (!videoImage) { setStatus("Add an image for your video first."); return; }
    if (!audio) { setStatus("Create a song or add audio first."); return; }
    setBusy("video"); setVideoUrl(null); setStatus("Buddy is creating your video…");
    try {
      const result = await withTimeout(runGradio(FREE_SPACE_IDS.video, "/predict", {
        image: freeFile(videoImage), input_image: freeFile(videoImage),
        audio: typeof audio === "string" ? audio : freeFile(audio),
        prompt: brief.trim() || "Cinematic natural motion synchronized to the music, smooth camera movement.", duration_seconds: 5,
      }, setStatus), 720_000);
      const url = resultUrl(result);
      if (!url) throw new Error("The video service returned no video file.");
      setVideoUrl(url); setStatus("Your video is ready.");
    } catch (e) { setStatus(`Video could not be completed: ${messageOf(e)}`); }
    finally { setBusy(null); }
  };
  const cloneVoice = async () => {
    if (!referenceVoice) { setStatus("Choose a reference voice first."); return; }
    setBusy("clone"); setCloneUrl(null); setStatus("Buddy is creating the voice result…");
    try {
      const result = await withTimeout(runGradio(FREE_SPACE_IDS.voiceClone, "/generate_voice_clone", {
        ref_audio: freeFile(referenceVoice), ref_text: "", target_text: brief.trim() || "Hello from Little Red's Big Studio.",
        language: "English", use_xvector_only: true, model_size: "1.7B",
      }, setStatus), 240_000);
      const url = resultUrl(result);
      if (!url) throw new Error("The voice service returned no audio file.");
      setCloneUrl(url); setStatus("Your voice result is ready.");
    } catch (e) { setStatus(`Voice creation could not be completed: ${messageOf(e)}`); }
    finally { setBusy(null); }
  };
  const swapVoice = async () => {
    if (!swapSource || !referenceVoice) { setStatus("Choose both voice files first."); return; }
    setBusy("swap"); setSwapUrl(null); setStatus("Buddy is transforming the voice…");
    try {
      const outputs = await withTimeout(runGradioAll(FREE_SPACE_IDS.voiceSwap, "/convert_voice_v1_wrapper", {
        source_audio_path: freeFile(swapSource), target_audio_path: freeFile(referenceVoice), diffusion_steps: 25,
        length_adjust: 1, inference_cfg_rate: 0.7, f0_condition: true, auto_f0_adjust: true, pitch_shift: 0, stream_output: false,
      }, setStatus), 720_000);
      const url = resultUrl(outputs[1]) ?? resultUrl(outputs[0]);
      if (!url) throw new Error("The voice conversion service returned no audio file.");
      setSwapUrl(url); setStatus("Your voice-swap result is ready.");
    } catch (e) { setStatus(`Voice swap could not be completed: ${messageOf(e)}`); }
    finally { setBusy(null); }
  };
  const save = () => { localStorage.setItem("lrbgs-song-brief", brief); localStorage.setItem("lrbgs-lyrics", lyrics); setStatus("Saved on this device."); };
  const disabled = busy !== null;
  return (
    <Panel eyebrow="CREATE" title="Turn an idea into something real" icon={<WandSparkles className="size-5" />} defaultOpen>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="font-display text-sm font-semibold">What are we making?</p><textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Tell Buddy what you want to create…" className="mt-3 w-full rounded-xl border border-border bg-background/70 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
      <section className="rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText className="size-4 text-primary" /><h3 className="font-display font-semibold">Lyrics</h3></div><StudioButton variant="ghost" onClick={() => void generateLyrics()} disabled={disabled}><WandSparkles className="size-4" />{busy === "lyrics" ? "Writing…" : "Generate lyrics"}</StudioButton></div><textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={8} placeholder="Your lyrics will appear here…" className="mt-3 w-full rounded-xl border border-border bg-background/70 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></section>
      <section className="rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex items-center gap-2"><Music2 className="size-4 text-primary" /><h3 className="font-display font-semibold">Music</h3></div><p className="my-3 text-xs text-muted-foreground">Buddy chooses the appropriate track length automatically.</p><StudioButton className="w-full" onClick={() => void generateSong()} disabled={disabled}>{busy === "song" ? <LoaderCircle className="size-4 animate-spin" /> : <Music2 className="size-4" />}{busy === "song" ? "Creating…" : "Generate song"}</StudioButton></section>
      {audioUrl && <MediaResult kind="audio" url={audioUrl} />}
      <section className="grid gap-3 sm:grid-cols-2"><ActionCard title="Artwork" icon={<ImageIcon className="size-5" />} busy={busy === "image"} disabled={disabled} onClick={() => void generateImage()} /><ActionCard title="Video" icon={<Film className="size-5" />} busy={busy === "video"} disabled={disabled} onClick={() => void generateVideo()} /></section>
      <div className="grid gap-3 sm:grid-cols-2"><FilePick label="Video image" accept="image/*" onFile={setVideoImage} /><FilePick label="Video audio (optional)" accept="audio/*" onFile={setVideoAudio} /></div>
      {imageUrl && <MediaResult kind="image" url={imageUrl} />}{videoUrl && <MediaResult kind="video" url={videoUrl} />}
      <section className="rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex items-center gap-2"><Mic2 className="size-4 text-primary" /><h3 className="font-display font-semibold">Voice</h3></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><FilePick label="Reference voice" accept="audio/*" onFile={setReferenceVoice} /><FilePick label="Source voice for swap" accept="audio/*" onFile={setSwapSource} /></div><div className="mt-3 grid grid-cols-2 gap-2"><StudioButton variant="ghost" onClick={() => void cloneVoice()} disabled={disabled}>{busy === "clone" ? <LoaderCircle className="size-4 animate-spin" /> : <Mic2 className="size-4" />}{busy === "clone" ? "Creating…" : "Clone voice"}</StudioButton><StudioButton variant="ghost" onClick={() => void swapVoice()} disabled={disabled}>{busy === "swap" ? <LoaderCircle className="size-4 animate-spin" /> : <Mic2 className="size-4" />}{busy === "swap" ? "Creating…" : "Swap voice"}</StudioButton></div></section>
      {cloneUrl && <MediaResult kind="audio" url={cloneUrl} />}{swapUrl && <MediaResult kind="audio" url={swapUrl} />}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 p-3"><p className="text-xs text-muted-foreground" aria-live="polite">{status}</p><StudioButton variant="ghost" onClick={save}><Save className="size-4" />Save</StudioButton></div><Note>Buddy handles the creation work behind the scenes and reports only the real result.</Note>
    </Panel>
  );
}
function ActionCard({ title, icon, busy, disabled, onClick }: { title: string; icon: React.ReactNode; busy: boolean; disabled: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} disabled={disabled} className="group rounded-2xl border border-border/70 bg-background/40 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"><span className="flex items-center justify-between"><span className="flex items-center gap-2 font-display font-semibold">{busy ? <LoaderCircle className="size-5 animate-spin text-primary" /> : icon}{busy ? "Creating…" : `Generate ${title}`}</span><span className="text-primary">→</span></span><span className="mt-2 block text-xs text-muted-foreground">Your finished {title.toLowerCase()} will appear here.</span></button>; }
function FilePick({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File | null) => void }) { return <label className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">{label}</span><input className="mt-2 block w-full text-xs" type="file" accept={accept} onChange={(e) => onFile(e.target.files?.[0] ?? null)} /></label>; }
function MediaResult({ kind, url }: { kind: "audio" | "image" | "video"; url: string }) { return <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3"><div className="mb-2 flex items-center justify-between"><span className="font-display text-xs font-bold uppercase tracking-wider text-primary">Ready</span><a href={url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 text-xs text-primary"><Download className="size-3.5" />Save</a></div>{kind === "audio" && <audio className="w-full" controls src={url} />}{kind === "image" && <img className="max-h-[28rem] w-full rounded-xl object-contain" src={url} alt="Your generated artwork" />}{kind === "video" && <video className="w-full rounded-xl" controls playsInline src={url} />}</div>; }
