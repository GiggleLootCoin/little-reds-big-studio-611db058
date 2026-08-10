function clamp(v: number) {
  return Math.max(-1, Math.min(1, v));
}

function encodeWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < frames; i++)
    for (let ch = 0; ch < channels; ch++) {
      const sample = clamp(buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1))[i]);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  return new Blob([out], { type: "audio/wav" });
}

async function loadBuffer(ctx: AudioContext | OfflineAudioContext, source: Blob | string) {
  const response = typeof source === "string" ? await fetch(source) : new Response(source);
  if (!response.ok) throw new Error("The audio result could not be downloaded for mixing.");
  const bytes = await response.arrayBuffer();
  return ctx.decodeAudioData(bytes.slice(0));
}

/** Mix a converted vocal over the supplied instrumental without exposing mix controls to the user. */
export async function mixVocalsWithInstrumental(vocal: Blob | string, instrumental: Blob | string) {
  const probe = new AudioContext();
  try {
    const [vocalBuffer, instrumentalBuffer] = await Promise.all([
      loadBuffer(probe, vocal),
      loadBuffer(probe, instrumental),
    ]);
    const sampleRate = Math.max(vocalBuffer.sampleRate, instrumentalBuffer.sampleRate, 44100);
    const channels = Math.max(vocalBuffer.numberOfChannels, instrumentalBuffer.numberOfChannels, 2);
    const length = Math.max(vocalBuffer.duration, instrumentalBuffer.duration);
    const offline = new OfflineAudioContext(channels, Math.ceil(length * sampleRate), sampleRate);
    const vocalSource = offline.createBufferSource();
    const instrumentalSource = offline.createBufferSource();
    vocalSource.buffer = vocalBuffer;
    instrumentalSource.buffer = instrumentalBuffer;
    const vocalGain = offline.createGain();
    vocalGain.gain.value = 0.96;
    const instrumentalGain = offline.createGain();
    instrumentalGain.gain.value = 0.92;
    vocalSource.connect(vocalGain).connect(offline.destination);
    instrumentalSource.connect(instrumentalGain).connect(offline.destination);
    vocalSource.start(0);
    instrumentalSource.start(0);
    const rendered = await offline.startRendering();
    return encodeWav(rendered);
  } finally {
    await probe.close().catch(() => undefined);
  }
}
