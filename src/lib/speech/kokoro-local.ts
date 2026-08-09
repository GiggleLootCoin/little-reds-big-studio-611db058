export type LocalTtsDevice = "webgpu" | "wasm";

export type LocalTtsVoice = {
  id: string;
  label: string;
  locale: string;
};

export const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

export const KOKORO_VOICES: LocalTtsVoice[] = [
  { id: "af_heart", label: "English — Heart", locale: "en-US" },
  { id: "bf_emma", label: "English — British Emma", locale: "en-GB" },
  { id: "bm_george", label: "English — British George", locale: "en-GB" },
  { id: "af_sky", label: "English — Sky", locale: "en-US" },
  { id: "ef_dora", label: "Spanish", locale: "es-ES" },
  { id: "ff_siwis", label: "French", locale: "fr-FR" },
  { id: "if_sara", label: "Italian", locale: "it-IT" },
  { id: "jf_alpha", label: "Japanese", locale: "ja-JP" },
  { id: "zf_xiaobei", label: "Chinese", locale: "zh-CN" },
  { id: "hf_alpha", label: "Hindi", locale: "hi-IN" },
];

type KokoroAudio = {
  audio?: Float32Array;
  sampling_rate?: number;
};

type KokoroInstance = {
  generate: (text: string, options: { voice: string }) => Promise<KokoroAudio>;
};

type KokoroModule = {
  KokoroTTS: {
    from_pretrained: (
      model: string,
      options: { dtype: "q4" | "q8"; device: LocalTtsDevice },
    ) => Promise<KokoroInstance>;
  };
};

let runtimePromise: Promise<KokoroInstance> | null = null;

async function loadRuntime(device: LocalTtsDevice): Promise<KokoroInstance> {
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    // Keep the neural runtime optional so the base Studio remains lightweight.
    // The package is open-source and the model runs locally after download/cache.
    const dynamicImport = new Function("url", "return import(url);") as (url: string) => Promise<KokoroModule>;
    const module = await dynamicImport("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm");
    return module.KokoroTTS.from_pretrained(KOKORO_MODEL, {
      dtype: "q4",
      device,
    });
  })();

  try {
    return await runtimePromise;
  } catch (error) {
    runtimePromise = null;
    throw error;
  }
}

function selectDevice(): LocalTtsDevice {
  return typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
}

function float32ToWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, Number.isFinite(samples[i]) ? samples[i] : 0));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function speakLocally(text: string, voice = "af_heart"): Promise<HTMLAudioElement> {
  if (typeof window === "undefined") throw new Error("Local speech is only available in the browser.");
  if (!text.trim()) throw new Error("There is no text to speak.");

  const selected = KOKORO_VOICES.some((item) => item.id === voice) ? voice : "af_heart";
  const runtime = await loadRuntime(selectDevice());
  const result = await runtime.generate(text.trim(), { voice: selected });

  if (!(result.audio instanceof Float32Array) || !result.audio.length) {
    throw new Error("The local voice model returned no audio.");
  }

  const blob = float32ToWav(result.audio, result.sampling_rate ?? 24000);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
  return audio;
}

export function isLocalNeuralSpeechAvailable(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}
