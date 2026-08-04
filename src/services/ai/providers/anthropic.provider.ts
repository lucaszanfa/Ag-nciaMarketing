import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ZodType } from "zod";
import type { AIProvider, AIProviderResult } from "./ai-provider.interface";

const DEFAULT_MODEL = "claude-opus-4-8";

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic();

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
      const response = await this.client.messages.parse(
        {
          model,
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature,
          thinking: { type: "adaptive" },
          output_config: {
            format: zodOutputFormat(params.schema),
            effort: "high",
          },
          system: params.systemPrompt,
          messages: [{ role: "user", content: params.userPrompt }],
        },
        params.timeoutMs ? { timeout: params.timeoutMs } : undefined
      );

      const durationMs = Date.now() - startedAt;

      if (response.stop_reason === "refusal") {
        throw new Error("A IA recusou a solicitação por motivos de segurança.");
      }

      if (!response.parsed_output) {
        throw new Error("A resposta da IA não pôde ser validada pelo schema esperado.");
      }

      return {
        data: response.parsed_output,
        model: response.model ?? model,
        durationMs,
        usage: {
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
          totalTokens:
            response.usage?.input_tokens != null && response.usage?.output_tokens != null
              ? response.usage.input_tokens + response.usage.output_tokens
              : null,
        },
      };
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error("Chave de API da Anthropic inválida ou ausente (ANTHROPIC_API_KEY).");
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error("Limite de requisições da Anthropic atingido. Tente novamente em instantes.");
      }
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        throw new Error(`Tempo limite excedido ao chamar a IA para o agente "${params.agentName}".`);
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new Error("Não foi possível conectar à API da Anthropic. Verifique sua conexão.");
      }
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Erro na API da Anthropic (${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
