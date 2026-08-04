import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z, type ZodType } from "zod";
import type { AIProvider, AIProviderResult } from "./ai-provider.interface";

// "-latest" is an evergreen alias Google hot-swaps to the newest Flash release
// (with advance notice on breaking changes) — pinning a dated model name here
// breaks the moment that version is retired for new API keys, which is what
// happened with the previously hardcoded "gemini-2.5-flash".
const DEFAULT_MODEL = "gemini-flash-latest";

/**
 * Alternative provider for the free-tier Google Gemini API. Selected via
 * `provider.factory.ts` when `AI_PROVIDER=gemini`. The SDK has no built-in
 * Zod integration (unlike the Anthropic/OpenAI helpers), so structured
 * output is enforced manually: the agent's Zod schema is converted to JSON
 * Schema and passed as `responseJsonSchema`, then the returned JSON text is
 * parsed and validated against the same Zod schema before being returned.
 */
export class GeminiProvider implements AIProvider {
  private client = new GoogleGenAI({});

  async generateStructuredOutput<T>(params: {
    agentName: string;
    systemPrompt: string;
    userPrompt: string;
    schema: ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AIProviderResult<T>> {
    const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
    const startedAt = Date.now();

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
        config: {
          systemInstruction: params.systemPrompt,
          temperature: params.temperature,
          // Thinking tokens are billed against this same budget, so give it
          // headroom on top of the shared AI_MAX_TOKENS config — otherwise
          // "think as hard as possible" eats the space meant for the answer
          // and truncates the JSON output instead.
          maxOutputTokens: params.maxTokens ? Math.max(params.maxTokens, 8000) : undefined,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          // Some agent schemas (e.g. Instagram writer) use `.transform()` for
          // convenience, which has no JSON Schema equivalent — fall back to
          // a permissive `{}` for just that part instead of throwing.
          responseJsonSchema: z.toJSONSchema(params.schema, { unrepresentable: "any" }),
          abortSignal: params.timeoutMs ? AbortSignal.timeout(params.timeoutMs) : undefined,
        },
      });

      const durationMs = Date.now() - startedAt;
      const finishReason = response.candidates?.[0]?.finishReason;

      if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
        throw new Error("A IA recusou a solicitação por motivos de segurança.");
      }

      let data: T;
      try {
        data = params.schema.parse(JSON.parse(response.text ?? ""));
      } catch {
        throw new Error("A resposta da IA não pôde ser validada pelo schema esperado.");
      }

      return {
        data,
        model: response.modelVersion ?? model,
        durationMs,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount ?? null,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: response.usageMetadata?.totalTokenCount ?? null,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          throw new Error("Chave de API do Gemini inválida ou ausente (GEMINI_API_KEY).");
        }
        if (error.status === 429) {
          throw new Error("Limite de requisições do Gemini atingido. Tente novamente em instantes.");
        }
        throw new Error(`Erro na API do Gemini (${error.status}): ${error.message}`);
      }
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(`Tempo limite excedido ao chamar a IA para o agente "${params.agentName}".`);
      }
      throw error;
    }
  }
}
