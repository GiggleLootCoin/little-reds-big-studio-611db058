import { useState } from "react";
import { LoaderCircle, Mic2, Play, Save, Sparkles } from "lucide-react";
import { FREE_SPACE_IDS, freeFile, outputUrl, runGradio } from "@/lib/gradio-free";
import { Note, Panel, StudioButton } from "./ui";

const VOICES = [
  ["af_heart", "English • Heart"],
  ["af_bella", "English • Bella"],
  ["af_nicole", "English • Nicole"],
  ["am_adam", "English • Adam"],
  ["am_michael", "English • Michael"],
  ["bf_emma", "British English • Emma"],
  ["bm_george", "British English • George"],
  ["jf_alpha", "Japanese • Alpha"],
  ["zf_xiaobei", "Chinese • Xiaobei"],
  ["ef_dora", "Spanish/European • Dora"],
] as const;

type VoiceId = (typeof VOICES)[number][0];

export function VoiceLabPanel() {
  const [voice, setVoice] = useState<VoiceId>(VOICES[0][0]);
  const [text, setText] = useState("Hello from Little Red's Big Studio. Buddy is ready to create.");
  const [reference, setReference] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Choose a voice or upload a voice sample.");

  const preview = async () => {
    setBusy(true);
    setAudioUrl(null);
    setStatus("Finding the best free voice engine…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.voicePreset, "/generate", [
        text,
        voice,
        1,
        true,
      ]);
      const url = outputUrl(result);
      if (!url) throw new Error("The voice engine returned no audio.");
      setAudioUrl(url);
      localStorage.setItem("lrbgs-buddy-voice-preset", voice);
      setStatus(
        "Voice preview ready. This voice is saved as Buddy's preferred preset on this device.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Voice generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const clone = async () => {
    if (!reference) {
      setStatus("Upload a voice sample first.");
      return;
    }
    setBusy(true);
    setAudioUrl(null);
    setStatus("Finding the best free cloning engine…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.voiceClone, "/generate_voice_clone", [
        freeFile(reference),
        "",
        text,
        "English",
      ]);
      const url = outputUrl(result);
      if (!url) throw new Error("The cloning engine returned no audio.");
      setAudioUrl(url);
      localStorage.setItem("lrbgs-buddy-voice-mode", "clone");
      setStatus("Voice clone ready. Buddy will remember that clone preference on this device.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Voice cloning failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel eyebrow="VOICE LAB" title="Buddy's voice" icon={<Mic2 className="size-5" />} defaultOpen>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="rounded-xl border border-border bg-background/30 p-3 text-xs">
          <span className="font-semibold">Voice</span>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value as VoiceId)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {VOICES.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <StudioButton onClick={() => void preview()} disabled={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
          Preview
        </StudioButton>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm"
        placeholder="What should Buddy say?"
      />
      <label className="block rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          Clone a voice you own or have permission to use
        </span>
        <input
          className="mt-2 block w-full text-xs"
          type="file"
          accept="audio/*"
          onChange={(e) => setReference(e.target.files?.[0] ?? null)}
        />
      </label>
      <StudioButton variant="ghost" onClick={() => void clone()} disabled={busy || !reference}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Create clone preview
      </StudioButton>
      {audioUrl && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
          <audio controls className="w-full" src={audioUrl} />
          <a className="mt-2 inline-flex text-xs text-primary" href={audioUrl} download>
            <Save className="mr-1 size-3.5" /> Save voice preview
          </a>
        </div>
      )}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
      <Note>
        Voice selection is stored locally. Cloning is intended only for voices you own or have
        permission to use.
      </Note>
    </Panel>
  );
}
