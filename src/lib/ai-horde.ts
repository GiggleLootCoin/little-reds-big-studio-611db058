const HORDE = "https://aihorde.net/api/v2";
const ANONYMOUS_KEY = "0000000000";

type HordeJob = {
  id: string;
  message?: string;
  done?: boolean;
  faulted?: boolean;
  generations?: Array<{ img?: string; text?: string }>;
};

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${HORDE}${path}`, {
    ...init,
    headers: {
      apikey: ANONYMOUS_KEY,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`AI Horde HTTP ${response.status}`);
  return response.json();
}

async function poll(id: string, timeoutMs = 8 * 60_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const job = (await request(`/generate/status/${id}`)) as HordeJob;
    if (job.faulted) throw new Error(job.message || "AI Horde generation failed.");
    if (job.done) return job;
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error("AI Horde generation timed out.");
}

export async function hordeImage(prompt: string) {
  const job = (await request("/generate/async", {
    method: "POST",
    body: JSON.stringify({ prompt, params: { width: 768, height: 768, steps: 20, n: 1 } }),
  })) as { id: string };
  const result = await poll(job.id);
  const image = result.generations?.find((g) => g.img)?.img;
  if (!image) throw new Error("AI Horde returned no image artifact.");
  return image;
}

export async function hordeText(prompt: string) {
  const job = (await request("/generate/async", {
    method: "POST",
    body: JSON.stringify({ prompt, params: { max_length: 512, max_context_length: 4096 } }),
  })) as { id: string };
  const result = await poll(job.id);
  const text = result.generations?.find((g) => g.text)?.text;
  if (!text) throw new Error("AI Horde returned no text artifact.");
  return text;
}
