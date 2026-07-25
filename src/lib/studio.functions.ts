import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3.6-flash";

async function runText(system: string, prompt: string) {
  const { createLovableAiGatewayProvider, requireLovableApiKey } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return text.trim();
}

const HOUSE_STYLE =
  "You are the engine behind Little Red's Big Studio — a crimson-lit, consciousness-first music video suite tuned to 432Hz resonance and base-12 harmonic thinking. You are direct, warm, and radio-ready in your standards. Format answers in clean markdown.";

/* 3 — Honest Critiquer AI Song Coach */
export const critiqueSong = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().default(""),
        genre: z.string().default(""),
        lyrics: z.string().default(""),
        notes: z.string().default(""),
        honesty: z.number().min(0).max(100).default(85),
        depth: z.number().min(0).max(100).default(70),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    runText(
      `${HOUSE_STYLE} You are the Honest Critiquer: an unflinching but constructive song coach. Honesty dial: ${data.honesty}/100 (higher = more brutal). Analysis depth: ${data.depth}/100.`,
      `Critique this song idea and give an upgrade plan.

Title: ${data.title || "(untitled)"}
Genre / reference: ${data.genre || "(unspecified)"}
Producer notes: ${data.notes || "(none)"}
Lyrics / structure:
${data.lyrics || "(none supplied)"}

Return sections:
## Verdict (one paragraph, plus a score out of 10)
## What's working
## What's holding it back
## Top-tier alternatives (numbered, specific, immediately usable — melody, arrangement, lyric rewrites)
## Mix & master targets (LUFS, low-end, vocal placement)
## Next 3 moves`,
    ).then((critique) => ({ critique })),
  );

/* 7 — Elite lyrics generator */
export const writeLyrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        theme: z.string().min(1),
        genre: z.string().default("cinematic pop"),
        mood: z.string().default("triumphant"),
        explicit: z.boolean().default(false),
        rhyme: z.number().min(0).max(100).default(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    runText(
      `${HOUSE_STYLE} You write professional, catchy, emotionally resonant lyrics with strong hooks and singable phrasing. Rhyme density target: ${data.rhyme}/100. ${data.explicit ? "Explicit language is allowed." : "Keep it clean — no profanity."}`,
      `Write a full song. Theme: ${data.theme}. Genre: ${data.genre}. Mood: ${data.mood}.
Include: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge], [Final Chorus], [Outro].
After the lyrics add a short "## Performance notes" section covering vocal delivery, ad-libs and harmony stacks.`,
    ).then((lyrics) => ({ lyrics })),
  );

/* 9 — Council of 9 chat / brainstorming */
export const councilChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .min(1)
          .max(40),
        seats: z.array(z.string()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { createLovableAiGatewayProvider, requireLovableApiKey } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
    const { text } = await generateText({
      model: gateway(MODEL),
      system: `${HOUSE_STYLE} You speak as the Council of 9 — a panel of specialists${
        data.seats.length ? ` currently seated: ${data.seats.join(", ")}` : ""
      }. Synthesise their perspectives into one decisive answer. Keep replies tight and actionable.`,
      messages: data.messages,
    });
    return { reply: text.trim() };
  });

/* 10 — Automated storyboarding */
export const buildStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().default(""),
        direction: z.string().min(1),
        bpm: z.number().min(40).max(220).default(120),
        durationSec: z.number().min(30).max(600).default(180),
        scenes: z.number().min(3).max(24).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    runText(
      `${HOUSE_STYLE} You are a music video director building shot-by-shot storyboards mapped to the beat grid.`,
      `Track: ${data.title || "(untitled)"} — ${data.bpm} BPM, ${data.durationSec}s long.
Creative direction: ${data.direction}

Produce exactly ${data.scenes} scenes. For each scene use this shape:

### Scene N — mm:ss–mm:ss (bars X–Y)
- **Shot:** camera move, lens, framing
- **Action:** what happens
- **Lighting & palette:** (crimson / obsidian house look unless the direction says otherwise)
- **Video prompt:** one dense paragraph ready to paste into Luma / Runway / Kling`,
    ).then((storyboard) => ({ storyboard })),
  );

/* 15 — YouTube SEO */
export const generateSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1),
        artist: z.string().default(""),
        genre: z.string().default(""),
        vibe: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    runText(
      `${HOUSE_STYLE} You are a YouTube growth strategist for independent musicians.`,
      `Track: "${data.title}" by ${data.artist || "an independent artist"}. Genre: ${data.genre}. Vibe: ${data.vibe}.

Return exactly these sections, ready to copy:
## Titles
5 options, each under 70 characters.
## Description
A full description: hook paragraph, credits placeholder, timestamps placeholder, links placeholder.
## Tags
20 comma-separated tags.
## Hashtags
8 hashtags on one line.`,
    ).then((seo) => ({ seo })),
  );

/* 13 — AI profile / cover artwork */
export const generateArtwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().min(3),
        reference: z.string().optional(),
        kind: z.enum(["avatar", "banner", "cover"]).default("avatar"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { generateGatewayImage } = await import("./ai-gateway.server");
    const shape =
      data.kind === "banner"
        ? "a wide cinematic banner image"
        : data.kind === "cover"
          ? "a square album cover"
          : "a square profile portrait";
    const url = await generateGatewayImage(
      `Create ${shape}. ${data.prompt}. Style: glossy crimson and obsidian, glowing red rim light, cinematic, ultra detailed, high contrast.`,
      data.reference,
    );
    return { url };
  });
