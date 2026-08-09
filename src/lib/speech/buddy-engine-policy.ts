export type BuddyEngine = "qwen3-tts" | "chatterbox-multilingual" | "pocket-tts" | "kokoro" | "native";

export type BuddyEngineProfile = {
  id: BuddyEngine;
  name: string;
  local: true;
  apiKeyRequired: false;
  accountRequired: false;
  paidInference: false;
  cloning: boolean;
  multilingual: boolean;
  preferred: boolean;
};

/**
 * Buddy's core voice policy: local, no account, no API key, no metered service.
 * Runtime selection must additionally verify that a compatible browser/mobile
 * runtime and model are actually available before selecting an engine.
 */
export const BUDDY_ENGINE_PROFILES: BuddyEngineProfile[] = [
  {
    id: "qwen3-tts",
    name: "Qwen3-TTS",
    local: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidInference: false,
    cloning: true,
    multilingual: true,
    preferred: true,
  },
  {
    id: "chatterbox-multilingual",
    name: "Chatterbox Multilingual",
    local: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidInference: false,
    cloning: true,
    multilingual: true,
    preferred: true,
  },
  {
    id: "pocket-tts",
    name: "Pocket TTS",
    local: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidInference: false,
    cloning: true,
    multilingual: false,
    preferred: false,
  },
  {
    id: "kokoro",
    name: "Kokoro",
    local: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidInference: false,
    cloning: false,
    multilingual: true,
    preferred: false,
  },
  {
    id: "native",
    name: "Device Speech Engine",
    local: true,
    apiKeyRequired: false,
    accountRequired: false,
    paidInference: false,
    cloning: false,
    multilingual: true,
    preferred: false,
  },
];

export function getBuddyEngineOrder(): BuddyEngineProfile[] {
  return [...BUDDY_ENGINE_PROFILES];
}

export function isAllowedBuddyEngine(engine: BuddyEngineProfile): boolean {
  return engine.local && !engine.apiKeyRequired && !engine.accountRequired && !engine.paidInference;
}
