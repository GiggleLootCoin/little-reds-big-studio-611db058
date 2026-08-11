import { useState } from "react";
import { LoaderCircle, Mic2, Play, Save, Sparkles } from "lucide-react";
import { FREE_SPACE_IDS, freeFile, outputUrl, runGradio } from "@/lib/gradio-free";
import { Note, Panel, StudioButton } from "./ui";

const VOICES = [
  ["Ryan", "English • Ryan"],
  ["Aiden", "English • Aiden"],
  ["Dylan", "English • Dylan"],
  ["Eric", "English • Eric"],
  ["Serena", "English • Serena"],
  ["Sohee", "Korean/English • Sohee"],
  ["Vivian", "English • Vivian"],
  ["Ono_anna", "Japanese • Ono Anna"],
  ["Uncle_fu", "Chinese • Uncle Fu"],
] as const;

type VoiceId = (typeof VOICES)[number][0];
const VOICE_DB = "lrbgs-buddy-voice";
const VOICE_STORE = "references";

async function storeReference(file: File) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(VOICE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(VOICE_STORE);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tx = request.result.transaction(VOICE_STORE, "readwrite");
      tx.objectStore(VOICE_STORE).put(file, "buddy-reference");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

export async function loadStoredBuddyVoice(): Promise<Blob | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve) => {
    const request = indexedDB.open(VOICE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(VOICE_STORE);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const tx = request.result.transaction(VOICE_STORE, "readonly");
      const get = tx.objectStore(VOICE_STORE).get("buddy-reference");
      get.onsuccess = () => resolve(get.result instanceof Blob ? get.result : null);
      get.onerror = () => resolve(null);
    };
  });
}

export function VoiceLabPanel() {
  const [voice, setVoice] = useState<VoiceId>(VOICES[0][0]);
  const [text, setText] = useState("Hello. I'm Buddy, and I'm ready to make something brilliant with you.");
  const [reference, setReference] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Choose a voice or upload a voice sample.");

  const preview = async () => {
    setBusy(true); setAudioUrl(null); setStatus("Finding the best natural voice engine…");
    try {
      const result = await runGradio(FREE_SPACE_IDS.voicePreset, "/generate_custom_voice", [text, "English", voice, "Natural, warm conversational delivery with realistic pauses, varied pacing and gentle breaths.", "1.7B"], setStatus);
      const url = outputUrl(result); if (!url) throw new Error("The voice engine returned no audio.");
      setAudioUrl(url); localStorage.setItem("lrbgs-buddy-voice-preset", voice); localStorage.setItem("lrbgs-buddy-voice-mode", "preset"); setStatus("Natural voice preview ready. Buddy will use this voice for live replies on this device.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Voice generation failed."); } finally { setBusy(false); }
  };

  const clone = async () => {
    if (!reference) { setStatus("Upload a voice sample first."); return; }
    setBusy(true); setAudioUrl(null); setStatus("Creating your voice reference…");
    try {
      await storeReference(reference);
      localStorage.setItem("lrbgs-buddy-voice-language", "English");
      const result = await runGradio(FREE_SPACE_IDS.voiceClone, "/generate_voice_clone", [freeFile(reference), "", text, "English", true, "1.7B"], setStatus);
      const url = outputUrl(result); if (!url) throw new Error("The cloning engine returned no audio.");
      setAudioUrl(url); localStorage.setItem("lrbgs-buddy-voice-mode", "clone"); setStatus("Voice clone ready. Buddy will use your permitted voice reference for live replies on this device.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Voice cloning failed."); } finally { setBusy(false); }
  };

  return (
    <Panel eyebrow="VOICE LAB" title="Buddy's voice" icon={<Mic2 className="size-5" />} defaultOpen>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="rounded-xl border border-border bg-background/30 p-3 text-xs"><span className="font-semibold">Natural voice</span><select value={voice} onChange={(e) => setVoice(e.target.value as VoiceId)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">{VOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <StudioButton onClick={() => void preview()} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />} Preview</StudioButton>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm" placeholder="What should Buddy say?" />
      <label className="block rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Clone a voice you own or have permission to use</span><input className="mt-2 block w-full text-xs" type="file" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setReference(file); if (file) void storeReference(file).catch(() => undefined); }} /></label>
      <StudioButton variant="ghost" onClick={() => void clone()} disabled={busy || !reference}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Create clone preview</StudioButton>
      {audioUrl && <div className="rounded-xl border border-primary/25 bg-primary/5 p-3"><audio controls className="w-full" src={audioUrl} /><a className="mt-2 inline-flex text-xs text-primary" href={audioUrl} download><Save className="mr-1 size-3.5" /> Save voice preview</a></div>}
      <p className="text-xs text-muted-foreground" aria-live="polite">{status}</p>
      <Note>Buddy keeps your reference voice in this browser's local storage. When you request cloning or conversion, the selected free public engine receives the sample for that generation request. Only use voice material you own or are authorized to submit.</Note>
    </Panel>
  );
}
