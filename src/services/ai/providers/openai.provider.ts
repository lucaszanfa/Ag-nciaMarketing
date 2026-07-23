import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";
import type { AIProvider, AIProviderResult } from "./ai-provider.interface";

const DEFAULT_MODEL = "gpt-4o";

/**
 * Alternative provider for agents/deployments that opt into OpenAI instead of
 * Anthropic. Selected via `provider.factory.ts` when `AI_PROVIDER=openai`.
 */
export class OpenAIProvider implements AIProvider {
  private client = new OpenAI();

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
      const response = await this.client.chat.completions.parse(
        {
          model,
          max_tokens: params.maxTokens,
          temperature: params.temperature,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          response_format: zodResponseFormat(params.schema, "output"),
        },
        params.timeoutMs ? { timeout: params.timeoutMs } : undefined
      );

      const durationMs = Date.now() - startedAt;
      const choice = response.choices[0];

      if (choice.message.refusal) {
        throw new Error(`A IA recusou a solicitação: ${choice.message.refusal}`);
      }
      if (!choice.message.parsed) {
        throw new Error("A resposta da IA não pôde ser validada pelo schema esperado.");
      }

      return {
        data: choice.message.parsed,
        model: response.model ?? model,
        durationMs,
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? null,
          outputTokens: response.usage?.completion_tokens ?? null,
          totalTokens: response.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      if (error instanceof OpenAI.AuthenticationError) {
        throw new Error("Chave de API da OpenAI inválida ou ausente (OPENAI_API_KEY).");
      }
      if (error instanceof OpenAI.RateLimitError) {
        throw new Error("Limite de requisições da OpenAI atingido. Tente novamente em instantes.");
      }
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        throw new Error(`Tempo limite excedido ao chamar a IA para o agente "${params.agentName}".`);
      }
      if (error instanceof OpenAI.APIConnectionError) {
        throw new Error("Não foi possível conectar à API da OpenAI. Verifique sua conexão.");
      }
      if (error instanceof OpenAI.APIError) {
        throw new Error(`Erro na API da OpenAI (${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
