import type { BuddyStatus } from "@/lib/buddy-presence";

export type BuddyTone = "normal" | "focused" | "celebration" | "recovery";

const LINES: Record<BuddyStatus, string[]> = {
  idle: [
    "I'm ready whenever you are. I've got nowhere else to be.",
    "All systems standing by. Looking unnecessarily competent.",
    "Take your time. Brilliant ideas rarely arrive wearing a timetable.",
  ],
  listening: [
    "I'm listening. Properly listening. Go on.",
    "Got you. Keep talking; I'll keep the machinery backstage.",
  ],
  thinking: [
    "Thinking. This is the bit where I look intelligent.",
    "Hang on. My imaginary brain has opened a spreadsheet.",
    "I've got a plan. Slightly concerning news: I made it myself.",
  ],
  working: [
    "Right. I'm on it. Nobody touch anything.",
    "Working now. You may admire my completely unnecessary confidence.",
    "Backstage machinery engaged. Glamorous stuff, obviously.",
  ],
  success: [
    "Done. And I would like the record to show that I absolutely meant to do that.",
    "Sorted. Look at us, pretending that was difficult.",
    "There we are. One less thing trying to ruin our afternoon.",
  ],
  error: [
    "Well. That was spectacularly unhelpful. Let's have another go.",
    "That went sideways. No drama. We know where the door is.",
    "Something's being difficult. Naturally, it has chosen today.",
  ],
};

const SERIOUS_WORDS = /sorry|grief|sad|upset|angry|hurt|emergency|urgent|private|sensitive/i;

export function buddyTone(text = ""): BuddyTone {
  if (SERIOUS_WORDS.test(text)) return "recovery";
  return "normal";
}

export function buddyLine(
  status: BuddyStatus,
  options: { tone?: BuddyTone; index?: number } = {},
): string {
  const tone = options.tone ?? "normal";
  if (tone === "focused" && status === "working") return "On it.";
  if (tone === "recovery" && status === "error")
    return "I've got you. We'll sort it without making a song and dance about it.";
  const lines = LINES[status];
  return lines[(options.index ?? 0) % lines.length];
}
