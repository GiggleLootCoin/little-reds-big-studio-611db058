export const CREATOR_SUPPORT = Object.freeze({
  cashApp: "https://cash.app/$LittleRedBigSmile",
  buyMeACoffee: "https://buymeacoffee.com/littleredbigsmile",
  youtube: "https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3",
  membershipPriceUsd: 10,
});

export type ShoutoutPreference = "public" | "private";

export interface SupporterRecognition {
  displayName: string;
  preference: ShoutoutPreference;
  message?: string;
}

/**
 * Public recognition is opt-in. Payment details, email addresses and amounts
 * are never suitable for the public shout-out feed.
 */
export function createSupporterRecognition(
  displayName: string,
  preference: ShoutoutPreference,
  message?: string,
): SupporterRecognition | null {
  if (preference !== "public") return null;
  const safeName = displayName.trim().slice(0, 80);
  if (!safeName) return null;
  return { displayName: safeName, preference, message: message?.trim().slice(0, 240) || undefined };
}

export const SUPPORT_COPY = Object.freeze({
  title: "Support Little Red's Big Studio",
  coffee: "☕💕 Buy Me a Coffee — International",
  cashApp: "💚 Cash App — send a little love",
  youtube: "🎙️✨ YouTube — music, videos and channel love",
  shoutout:
    "Special Thank You Shout-Outs are available to supporters who choose public recognition.",
});
