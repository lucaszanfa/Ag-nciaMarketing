import type { ZodType } from "zod";

/**
 * Seam every real AI call goes through. Agents never call OpenAI/Anthropic
 * SDKs directly — they depend on this interface, so swapping providers (or
 * adding a new one) never touches agent code.
 */
export interface AIProviderUsage {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
}

export interface AIProviderResult<T> {
  data: T;
  usage?: AIProviderUsage | null;
  model?: string | null;
  durationMs?: number | null;
}

export interface AIProvider {
  generateStructuredOutput<T>(params: {
    agentName: string;
    systemPrompt: string;
    userPrompt: string;
    schema: ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AIProviderResult<T>>;
}
