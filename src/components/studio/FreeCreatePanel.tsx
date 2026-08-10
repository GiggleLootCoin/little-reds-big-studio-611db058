import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Download,
  FileText,
  Film,
  Image,
  LoaderCircle,
  Mic2,
  Music2,
  Save,
  WandSparkles,
} from "lucide-react";
import { FREE_RUNNERS } from "@/lib/free-runners";
import {
  FREE_SPACE_IDS,
  freeFile,
  firstOutput,
  outputUrl,
  runGradio,
  runGradioAll,
} from "@/lib/gradio-free";
import { Note, Panel, Readout, StudioButton, StudioSlider } from "./ui";

function runner(id: string) {
  return FREE_RUNNERS.find((r) => r.id === id)!;
}

export function FreeCreatePanel() {
  const [brief, setBrief] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [lyricsBusy, setLyricsBusy] = useState(false);
  const [status, setStatus] = useState(
    "Real free engines are connected. Results appear here when generation completes.",
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [cloneUrl, setCloneUrl] = useState<string | null>(null);
  const [swapUrl, setSwapUrl] = useState<string | null>(null);
  const [sourceAudio, setSourceAudio] = useState<File | null>(null);
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [videoImage, setVideoImage] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const ace = runner("hf-ace-step");
  const rvc = runner("hf-rvc");
  const seed = runner("hf-seed-vc");
  const clone = runner("hf-qwen3-tts");
  const image = runner("hf-z-image");
  const video = runner("hf-wan-s2v");

  useEffect(() => {
    setBrief(localStorage.getItem("lrbgs-song-brief") || "");
    setLyrics(localStorage.getItem("lrbgs-lyrics") || "");
  }, []);

  const generateLyrics = async () => {
    setLyricsBusy(true);
    setStatus("Writing original lyrics locally on this Android browser…");
    try {
      const dynamicImport = new Function("url", "return import(url)") as (
        url: string,
      ) => Promise<any>;
      const lib = await dynamicImport(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0",
      );
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      const model = await lib.pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", {
        dtype: hasGpu ? "q4f16" : "q4",
        device: hasGpu ? "webgpu" : "wasm",
      });
      const result = await model(
        [
          {
            role: "system",
            content:
              "You are a professional songwriter. Return only original lyrics. Never imitate living artists or quote existing lyrics.",
          },
          {
            role: "user",
            content: `Write singable original lyrics for: ${brief.trim() || "an emotional modern song"}. Use [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus].`,
          },
        ],
        { max_new_tokens: 700, temperature: 0.9, do_sample: true, return_full_text: false },
      );
      const first = Array.isArray(result) ? result[0] : result;
      const generated =
        typeof first?.generated_text === "string"
          ? first.generated_text
          : first?.generated_text?.at?.(-1)?.content;
      if (!generated) throw new Error("The local model returned no lyrics.");
      const clean = generated.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      setLyrics(clean);
      localStorage.setItem("lrbgs-lyrics", clean);
      setStatus("Lyrics generated locally and saved in this browser.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Lyrics failed: ${error.message}`
          : "Lyrics generation failed on this device.",
      );
    } finally {
      setLyricsBusy(false);
    }
  };

  const generateSong = async () => {
    setBusy("song");
    setAudioUrl(null);
    setStatus("Submitting a real song-generation job to ACE-Step 1.5…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.music, "/create", {
        description: `${brief.trim() || "Original song"}\nLyrics:\n${lyrics.trim() || "Create suitable original lyrics."}`,
        audio_duration: seconds,
        seed: -1,
        community: false,
      });
      const url = outputUrl(result) ?? outputUrl(firstOutput(result));
      if (!url) throw new Error("ACE-Step returned no audio file.");
      setAudioUrl(url);
      setStatus("Song generated successfully. You can play or download the real audio below.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Song generation failed: ${error.message}`
          : "Song generation failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const generateImage = async () => {
    setBusy("image");
    setImageUrl(null);
    setStatus("Generating a real image with Z Image Turbo…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.image, "/generate_image", {
        prompt:
          brief.trim() || "A cinematic album cover for an original song, premium music artwork",
        height: 1024,
        width: 1024,
        num_inference_steps: 9,
        seed: 42,
        randomize_seed: true,
      });
      const url = outputUrl(result);
      if (!url) throw new Error("Image engine returned no image file.");
      setImageUrl(url);
      setStatus("Image generated successfully.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Image generation failed: ${error.message}`
          : "Image generation failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const generateVideo = async () => {
    setBusy("video");
    setVideoUrl(null);
    setStatus("Generating a real video with Wan 2.2…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.video, "/generate_video", {
        image: videoImage ? freeFile(videoImage) : null,
        prompt:
          brief.trim() ||
          "Cinematic music video scene with expressive movement and dramatic lighting",
        height: 704,
        width: 1280,
        duration_seconds: 2,
        sampling_steps: 25,
        guide_scale: 5,
        shift: 5,
        seed: -1,
      });
      const url = outputUrl(result);
      if (!url) throw new Error("Video engine returned no MP4.");
      setVideoUrl(url);
      setStatus("Video generated successfully.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Video generation failed: ${error.message}`
          : "Video generation failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const cloneVoice = async () => {
    if (!referenceAudio) {
      setStatus("Choose a reference voice recording first.");
      return;
    }
    setBusy("clone");
    setCloneUrl(null);
    setStatus("Cloning the reference voice with Qwen3-TTS 1.7B…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.voiceClone, "/generate_voice_clone", {
        ref_audio: freeFile(referenceAudio),
        ref_text: "",
        target_text: brief.trim() || "Hello from Little Red's Big Studio.",
        language: "English",
        use_xvector_only: true,
        model_size: "1.7B",
      });
      const url = outputUrl(result);
      if (!url) throw new Error("Voice clone returned no audio.");
      setCloneUrl(url);
      setStatus(
        "Voice clone generated successfully. Use only voices you own or have permission to transform.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? `Voice clone failed: ${error.message}` : "Voice clone failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const swapVoice = async () => {
    if (!sourceAudio || !referenceAudio) {
      setStatus("Choose both source audio and reference voice first.");
      return;
    }
    setBusy("swap");
    setSwapUrl(null);
    setStatus("Converting the source voice with Seed-VC V1…");
    try {
      const outputs = await runGradioAll(FREE_SPACE_IDS.voiceSwap, "/convert_voice_v1_wrapper", {
        source_audio_path: freeFile(sourceAudio),
        target_audio_path: freeFile(referenceAudio),
        diffusion_steps: 25,
        length_adjust: 1,
        inference_cfg_rate: 0.7,
        f0_condition: true,
        auto_f0_adjust: true,
        pitch_shift: 0,
        stream_output: false,
      });
      const url = outputUrl(outputs[1]) ?? outputUrl(outputs[0]);
      if (!url) throw new Error("Seed-VC returned no converted audio.");
      setSwapUrl(url);
      setStatus(
        "Voice swap completed successfully. Singing mode uses Seed-VC's F0-conditioned route.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? `Voice swap failed: ${error.message}` : "Voice swap failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const save = () => {
    localStorage.setItem("lrbgs-song-brief", brief);
    localStorage.setItem("lrbgs-lyrics", lyrics);
    setStatus("Project text saved locally on this device.");
  };

  return (
    <Panel
      eyebrow="Real Free Engines"
      title="Create for real — outputs come back here"
      icon={<Music2 className="size-5" />}
      defaultOpen
    >
      <p className="text-sm text-muted-foreground">
        These buttons call actual public/open Gradio engines. Heavy models run remotely on their
        free shared GPU; the Studio does not fake completion.
      </p>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={4}
        placeholder="Describe your song, artwork or video…"
        className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="rounded-xl border border-border/70 bg-background/45 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-display text-sm font-semibold">Lyrics</span>
          </div>
          <StudioButton variant="ghost" onClick={() => void generateLyrics()} disabled={lyricsBusy}>
            {lyricsBusy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <WandSparkles className="size-4" />
            )}
            {lyricsBusy ? "Writing…" : "Generate lyrics"}
          </StudioButton>
        </div>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={8}
          placeholder="Generate original lyrics here, or write your own."
          className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <StudioSlider
        label="Song length"
        value={seconds}
        min={30}
        max={180}
        step={5}
        unit="s"
        onChange={setSeconds}
      />
      <div className="grid grid-cols-2 gap-2">
        <StudioButton
          className="w-full"
          onClick={() => void generateSong()}
          disabled={busy !== null}
        >
          {busy === "song" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Music2 className="size-4" />
          )}
          Generate song
        </StudioButton>
        <StudioButton variant="ghost" className="w-full" onClick={save}>
          <Save className="size-4" />
          Save locally
        </StudioButton>
      </div>
      {audioUrl && <MediaResult kind="audio" url={audioUrl} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <ToolCard
          title="Generate image"
          note={image.name}
          icon={<Image className="size-4" />}
          busy={busy === "image"}
          onClick={() => void generateImage()}
        />
        <ToolCard
          title="Generate video"
          note={video.name}
          icon={<Film className="size-4" />}
          busy={busy === "video"}
          onClick={() => void generateVideo()}
        />
      </div>
      <label className="block rounded-xl border border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
        Optional video reference image
        <input
          className="mt-2 block w-full text-xs"
          type="file"
          accept="image/*"
          onChange={(e) => setVideoImage(e.target.files?.[0] ?? null)}
        />
      </label>
      {imageUrl && <MediaResult kind="image" url={imageUrl} />}
      {videoUrl && <MediaResult kind="video" url={videoUrl} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
          Reference voice
          <input
            className="mt-2 block w-full text-xs"
            type="file"
            accept="audio/*"
            onChange={(e) => setReferenceAudio(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="rounded-xl border border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
          Source voice for swap
          <input
            className="mt-2 block w-full text-xs"
            type="file"
            accept="audio/*"
            onChange={(e) => setSourceAudio(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StudioButton variant="ghost" onClick={() => void cloneVoice()} disabled={busy !== null}>
          <Mic2 className="size-4" />
          {busy === "clone" ? "Cloning…" : "Voice clone"}
        </StudioButton>
        <StudioButton variant="ghost" onClick={() => void swapVoice()} disabled={busy !== null}>
          <Mic2 className="size-4" />
          {busy === "swap" ? "Swapping…" : "Voice swap"}
        </StudioButton>
      </div>
      {cloneUrl && <MediaResult kind="audio" url={cloneUrl} />}
      {swapUrl && <MediaResult kind="audio" url={swapUrl} />}
      <Note>
        <Readout label="Song" value={ace.name} />
        <Readout label="Lyrics" value="Local Qwen3 browser model" />
        <Readout label="Image" value={image.name} />
        <Readout label="Video" value={video.name} />
        <Readout label="Voice clone" value={clone.name + " 1.7B"} />
        <Readout label="Voice swap" value={rvc.name + " + " + seed.name} />
        <Readout label="API key" value="None" />
      </Note>
      <p className="text-[0.68rem] leading-relaxed text-muted-foreground">{status}</p>
      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
        Public ZeroGPU services can queue, sleep or impose anonymous quotas. The Studio reports the
        actual returned file or the actual error instead of pretending a job completed.
      </p>
    </Panel>
  );
}

function ToolCard({
  title,
  note,
  icon,
  busy,
  onClick,
}: {
  title: string;
  note: string;
  icon: ReactNode;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <StudioButton
      variant="ghost"
      className="w-full justify-start"
      onClick={onClick}
      disabled={busy}
    >
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : icon}
      <span className="text-left">
        <strong className="block">{title}</strong>
        <small className="text-muted-foreground">{note}</small>
      </span>
    </StudioButton>
  );
}

function MediaResult({ kind, url }: { kind: "audio" | "image" | "video"; url: string }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
          Real output
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download
          className="inline-flex items-center gap-1 text-xs text-primary"
        >
          <Download className="size-3.5" />
          Download
        </a>
      </div>
      {kind === "audio" && <audio className="w-full" controls src={url} />}
      {kind === "image" && (
        <img
          className="max-h-[28rem] w-full rounded-lg object-contain"
          src={url}
          alt="Generated artwork"
        />
      )}
      {kind === "video" && <video className="w-full rounded-lg" controls playsInline src={url} />}
    </div>
  );
}
