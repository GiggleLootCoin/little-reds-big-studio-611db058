export type BuddyVoiceKind = "browser" | "cloned";

export type BuddyVoice = {
  id: string;
  name: string;
  language: string;
  locale: string;
  kind: BuddyVoiceKind;
  description: string;
};

export const BUDDY_VOICES: BuddyVoice[] = [
  { id: "browser-en-us", name: "Buddy — English", language: "English", locale: "en-US", kind: "browser", description: "Uses a voice already installed on the phone." },
  { id: "browser-es-es", name: "Buddy — Español", language: "Spanish", locale: "es-ES", kind: "browser", description: "Free local Spanish speech when an installed voice is available." },
  { id: "browser-fr-fr", name: "Buddy — Français", language: "French", locale: "fr-FR", kind: "browser", description: "Free local French speech when an installed voice is available." },
  { id: "browser-de-de", name: "Buddy — Deutsch", language: "German", locale: "de-DE", kind: "browser", description: "Free local German speech when an installed voice is available." },
  { id: "browser-it-it", name: "Buddy — Italiano", language: "Italian", locale: "it-IT", kind: "browser", description: "Free local Italian speech when an installed voice is available." },
  { id: "browser-pt-br", name: "Buddy — Português", language: "Portuguese", locale: "pt-BR", kind: "browser", description: "Free local Portuguese speech when an installed voice is available." },
  { id: "browser-ja-jp", name: "Buddy — 日本語", language: "Japanese", locale: "ja-JP", kind: "browser", description: "Free local Japanese speech when an installed voice is available." },
  { id: "browser-ko-kr", name: "Buddy — 한국어", language: "Korean", locale: "ko-KR", kind: "browser", description: "Free local Korean speech when an installed voice is available." },
  { id: "browser-zh-cn", name: "Buddy — 中文", language: "Chinese", locale: "zh-CN", kind: "browser", description: "Free local Chinese speech when an installed voice is available." },
  { id: "browser-hi-in", name: "Buddy — हिन्दी", language: "Hindi", locale: "hi-IN", kind: "browser", description: "Free local Hindi speech when an installed voice is available." },
  { id: "buddy-cloned-local", name: "Buddy — Cloned Voice", language: "English", locale: "en-US", kind: "cloned", description: "Reserved for a locally installed, user-authorized Buddy voice model. No cloud API required." },
];

export function getAvailableSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function findSpeechVoice(locale: string, voices = getAvailableSpeechVoices()): SpeechSynthesisVoice | undefined {
  const normalized = locale.toLowerCase();
  return voices.find((voice) => voice.lang.toLowerCase() === normalized)
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(normalized.split("-")[0]));
}

export function speakBuddy(text: string, voiceId = "browser-en-us", rate = 1, pitch = 1): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const selected = BUDDY_VOICES.find((voice) => voice.id === voiceId) ?? BUDDY_VOICES[0];
  if (selected.kind === "cloned") return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selected.locale;
  utterance.rate = rate;
  utterance.pitch = pitch;
  const voice = findSpeechVoice(selected.locale);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
