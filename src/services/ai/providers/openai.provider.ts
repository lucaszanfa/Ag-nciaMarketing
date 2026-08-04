import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";
import type { AIProvider, AIProviderResult } from "./ai-provider.interface";

const DEFAULT_MODEL = "gpt-4o";

/**
 * Alternative provider for agents/deployments that opt into OpenAI instead of
 * Anthropic. Selected via `provider.factory.ts` when `AI_PROVIDER=openai`.
 *
 * Also doubles as the client for any OpenAI-compatible local server (LM
 * Studio, Ollama, text-generation-webui, vLLM, ...) — pass `baseURL`/`apiKey`
 * to point at one instead of the real OpenAI API (see `AI_PROVIDER=lmstudio`
 * in `provider.factory.ts`). With no options, behavior is unchanged from
 * before this was added: `new OpenAI()` reads `OPENAI_API_KEY` from env.
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;
  private label: string;

  constructor(options?: { baseURL: string; apiKey: string; defaultModel: string }) {
    this.client = options ? new OpenAI({ baseURL: options.baseURL, apiKey: options.apiKey }) : new OpenAI();
    this.defaultModel = options?.defaultModel ?? DEFAULT_MODEL;
    this.label = options ? "servidor local (LM Studio)" : "OpenAI";
  }

  async generateStructuredOutput<T>(params: {
    agentName: string;
    systemPrompt: string;
    userPrompt: string;
    schema: ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AIProviderResult<T>> {
    const model = process.env.AI_MODEL?.trim() || this.defaultModel;
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
        throw new Error(`Chave de API do ${this.label} inválida ou ausente (OPENAI_API_KEY).`);
      }
      if (error instanceof OpenAI.RateLimitError) {
        throw new Error(`Limite de requisições do ${this.label} atingido. Tente novamente em instantes.`);
      }
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        throw new Error(`Tempo limite excedido ao chamar a IA para o agente "${params.agentName}".`);
      }
      if (error instanceof OpenAI.APIConnectionError) {
        throw new Error(`Não foi possível conectar ao ${this.label}. Verifique se o servidor está rodando e acessível.`);
      }
      if (error instanceof OpenAI.APIError) {
        throw new Error(`Erro na API do ${this.label} (${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
