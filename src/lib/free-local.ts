/** Browser-native zero-cost fallbacks. These do not consume API/GPU quotas. */
export type LocalSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export function browserTts(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    throw new Error("Browser speech synthesis is unavailable on this device.");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function browserSpeechRecognition(
  onText: (text: string) => void,
  onEnd?: () => void,
  lang = "en-US",
) {
  if (typeof window === "undefined") throw new Error("Speech recognition requires a browser.");
  const browser = window as unknown as {
    SpeechRecognition?: new () => LocalSpeechRecognition;
    webkitSpeechRecognition?: new () => LocalSpeechRecognition;
  };
  const Ctor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!Ctor)
    throw new Error(
      "This browser does not provide speech recognition. Use Chrome on Android or type your message instead.",
    );
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const first = event.results?.[0]?.[0];
    if (first?.transcript) onText(first.transcript);
  };
  recognition.onend = () => onEnd?.();
  recognition.onerror = (event) => {
    onEnd?.();
    console.warn("Speech recognition error", event.error);
  };
  recognition.start();
  return recognition;
}
