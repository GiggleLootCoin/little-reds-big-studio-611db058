const providers = [
  {
    id: "local",
    capabilities: ["chat", "speech-to-text", "text-to-speech"],
    requiredKeys: false,
    quota: "device-dependent",
  },
  {
    id: "cloudflare-ai",
    capabilities: ["text", "speech", "lightweight-image"],
    requiredKeys: true,
    quota: "free allocation when configured",
  },
  {
    id: "public-gradio",
    capabilities: ["image", "music", "video", "voice", "speech"],
    requiredKeys: false,
    quota: "provider-dependent",
  },
];

export const onRequestGet = async () =>
  Response.json(
    {
      policy: "free-first",
      providers,
      rule: "Availability is probed at request time; a provider is never reported as working merely because it is configured.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
