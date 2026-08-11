import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hordeImage, hordeText } from "./ai-horde";

const HOUSE_STYLE = "Little Red's Big Studio: crimson-lit, cinematic, direct, warm, radio-ready, creator-first.";
async function realText(prompt: string) {
  const result = await hordeText(`${HOUSE_STYLE}\nYou are Buddy, the real creative AI inside Little Red's Big Studio. Return the requested finished content directly. Never return instructions telling the user to open another website or run a job elsewhere.\n\n${prompt}`);
  if (!result.trim()) throw new Error("Free AI returned no usable text.");
  return result.trim();
}

export const critiqueSong = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ title: z.string().default(""), genre: z.string().default(""), lyrics: z.string().default(""), notes: z.string().default(""), honesty: z.number().default(85), depth: z.number().default(70) }).parse(input))
  .handler(async ({ data }) => ({ critique: await realText(`Critique this song. Honesty ${data.honesty}/100; depth ${data.depth}/100.\nTitle: ${data.title}\nGenre: ${data.genre}\nNotes: ${data.notes}\nLyrics:\n${data.lyrics}\nReturn verdict/10, strengths, weaknesses, specific lyric and arrangement alternatives, mix targets and the next 3 moves.`) }));

export const writeLyrics = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ theme: z.string().min(1), genre: z.string().default("cinematic pop"), mood: z.string().default("triumphant"), explicit: z.boolean().default(false), rhyme: z.number().default(80) }).parse(input))
  .handler(async ({ data }) => ({ lyrics: await realText(`Write a complete original song about ${data.theme}. Genre ${data.genre}; mood ${data.mood}; rhyme density ${data.rhyme}/100; explicit=${data.explicit}. Include Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Bridge, Final Chorus and Outro. Do not quote existing lyrics.`) }));

export const studioChat = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1), focus: z.array(z.string()).default([]) }).parse(input))
  .handler(async ({ data }) => ({ reply: await realText(`Act as Buddy, one practical creative assistant for Little Red's Big Studio. Focus areas: ${data.focus.join(", ") || "songwriting, production, vocals, artwork, video and YouTube"}. Give one decisive answer. Conversation:\n${data.messages.map((message) => `${message.role}: ${message.content}`).join("\n")}`) }));

export const buildStoryboard = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ title: z.string().default(""), direction: z.string().min(1), bpm: z.number().default(120), durationSec: z.number().default(180), scenes: z.number().default(10) }).parse(input))
  .handler(async ({ data }) => ({ storyboard: await realText(`Create exactly ${data.scenes} shot-by-shot music-video scenes for ${data.title}. ${data.bpm} BPM, ${data.durationSec}s. Direction: ${data.direction}. For each scene provide timing/bars, shot, action, lighting/palette and a dense generation prompt.`) }));

export const generateSeo = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ title: z.string(), artist: z.string().default(""), genre: z.string().default(""), vibe: z.string().default("") }).parse(input))
  .handler(async ({ data }) => ({ seo: await realText(`For ${data.title} by ${data.artist}, genre ${data.genre}, vibe ${data.vibe}: return 5 titles under 70 characters, a complete YouTube description, 20 tags and 8 hashtags.`) }));

export const generateArtwork = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ prompt: z.string().min(3), reference: z.string().optional(), kind: z.enum(["avatar", "banner", "cover"]).default("avatar") }).parse(input))
  .handler(async ({ data }) => {
    const prompt = `Create a premium ${data.kind} for Little Red's Big Studio. ${data.prompt}. ${data.reference ? `Reference description: ${data.reference}.` : ""}`;
    const url = await hordeImage(prompt);
    if (!url) throw new Error("Free image AI returned no image artifact.");
    return { url, prompt };
  });
