import type { AIProvider } from "./ai-provider.interface";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { OpenAIProvider } from "./openai.provider";

let cached: AIProvider | null = null;
let cachedFor: string | null = null;

/** Picks the AI provider based on `AI_PROVIDER` (defaults to Anthropic). */
export function getAiProvider(): AIProvider {
  const selected = process.env.AI_PROVIDER?.trim().toLowerCase() || "anthropic";

  if (cached && cachedFor === selected) return cached;

  if (selected === "openai") {
    cached = new OpenAIProvider();
  } else if (selected === "gemini") {
    cached = new GeminiProvider();
  } else if (selected === "lmstudio") {
    cached = new OpenAIProvider({
      baseURL: process.env.LM_STUDIO_BASE_URL?.trim() ?? "",
      apiKey: "lm-studio",
      defaultModel: process.env.AI_MODEL?.trim() || "local-model",
    });
  } else {
    cached = new AnthropicProvider();
  }
  cachedFor = selected;
  return cached;
}
