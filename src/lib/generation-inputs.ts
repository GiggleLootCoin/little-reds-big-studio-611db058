export function premiumImagePrompt(prompt: string) {
  const base = prompt.trim() || "cinematic premium album cover for Little Red's Big Studio";
  return `${base}. Professional commercial artwork, striking composition, clear focal subject, intentional lighting, rich cinematic depth, realistic materials, refined color grading, premium editorial photography, highly detailed, polished finish, no text, no watermark, no logo, no extra fingers, no distorted faces, no duplicate subjects.`;
}

export const IMAGE_NEGATIVE_PROMPT = "blurry, low quality, low detail, bad anatomy, deformed hands, extra fingers, duplicate subject, distorted face, warped objects, text, watermark, logo, cropped subject, oversaturated, noisy, jpeg artifacts";
