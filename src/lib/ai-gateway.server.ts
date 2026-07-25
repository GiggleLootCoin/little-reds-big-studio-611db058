import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Server-only Lovable AI Gateway provider. */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function requireLovableApiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured yet (missing LOVABLE_API_KEY).");
  return key;
}

/** Image generation through the gateway (returns a base64 data URL). */
export async function generateGatewayImage(prompt: string, referenceDataUrl?: string) {
  const key = requireLovableApiKey();
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  if (referenceDataUrl) {
    content.push({ type: "image_url", image_url: { url: referenceDataUrl } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image generation failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
  };
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("The image model returned no image.");
  return url;
}
