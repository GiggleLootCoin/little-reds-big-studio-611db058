export type AiCapability =
  "chat" | "reasoning" | "coding" | "vision" | "image" | "audio" | "video" | "agents";

export type AiModelOption = {
  id: string;
  provider: string;
  model: string;
  capabilities: AiCapability[];
  local: true;
  openWeights: true;
  apiRequired: false;
  license: string;
  androidFit: "excellent" | "good" | "runner";
  notes: string;
};

/**
 * Core AI registry. Only genuinely local/open-weight models belong here.
 * Hosted providers are intentionally excluded so the Studio cannot expose
 * a paid/API-dependent path as if it were part of the free-local core.
 * Model weights are fetched on demand by a local runner and never committed.
 */
export const FREE_OPEN_AI_MODELS: AiModelOption[] = [
  {
    id: "qwen3",
    provider: "Qwen",
    model: "Qwen3",
    capabilities: ["chat", "reasoning", "coding", "vision", "agents"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Apache-2.0",
    androidFit: "good",
    notes: "Primary general-purpose local family; choose the smallest compatible variant.",
  },
  {
    id: "deepseek-v4",
    provider: "DeepSeek",
    model: "DeepSeek-V4",
    capabilities: ["chat", "reasoning", "coding", "agents"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Provider model license; verify exact checkpoint",
    androidFit: "runner",
    notes: "High-end reasoning/coding option; too large for most phones.",
  },
  {
    id: "deepseek-r1",
    provider: "DeepSeek",
    model: "DeepSeek-R1",
    capabilities: ["chat", "reasoning", "coding"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "MIT",
    androidFit: "good",
    notes: "Strong local reasoning option with smaller distilled variants available.",
  },
  {
    id: "llama",
    provider: "Meta",
    model: "Llama",
    capabilities: ["chat", "reasoning", "coding", "vision", "agents"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Llama Community License",
    androidFit: "good",
    notes: "Broad local ecosystem and many mobile quantizations.",
  },
  {
    id: "mistral",
    provider: "Mistral AI",
    model: "Mistral",
    capabilities: ["chat", "reasoning", "coding", "agents"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Varies by checkpoint",
    androidFit: "good",
    notes: "Efficient local family; exact model license must be checked.",
  },
  {
    id: "gemma",
    provider: "Google",
    model: "Gemma",
    capabilities: ["chat", "reasoning", "coding", "vision"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Gemma Terms",
    androidFit: "excellent",
    notes: "Strong compact option for phones and browser/local runtimes.",
  },
  {
    id: "phi",
    provider: "Microsoft",
    model: "Phi",
    capabilities: ["chat", "reasoning", "coding", "vision"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Varies by checkpoint",
    androidFit: "excellent",
    notes: "Small models are especially useful on Android.",
  },
  {
    id: "qwen2-vl",
    provider: "Qwen",
    model: "Qwen2.5-VL",
    capabilities: ["chat", "vision", "coding", "agents"],
    local: true,
    openWeights: true,
    apiRequired: false,
    license: "Apache-2.0",
    androidFit: "good",
    notes: "Strong local image/document understanding.",
  },
];

export function getLocalAiModels(capability?: AiCapability): AiModelOption[] {
  return FREE_OPEN_AI_MODELS.filter(
    (model) => !capability || model.capabilities.includes(capability),
  );
}

export function chooseLocalAiModel(
  capability: AiCapability,
  preferSmall = true,
): AiModelOption | undefined {
  const models = getLocalAiModels(capability);
  if (preferSmall)
    return (
      models.find((model) => model.androidFit === "excellent") ??
      models.find((model) => model.androidFit === "good") ??
      models[0]
    );
  return models.find((model) => model.androidFit === "runner") ?? models[0];
}
