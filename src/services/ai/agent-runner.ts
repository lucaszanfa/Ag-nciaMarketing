import type { ZodType } from "zod";
import { getAiConfig, hasProviderApiKey } from "./config";
import { getAiProvider } from "./providers/provider.factory";
import type { AIProviderUsage } from "./providers/ai-provider.interface";

export interface AgentRunResult<T> {
  data: T;
  usedFallback: boolean;
  retryCount: number;
  provider: string | null;
  model: string | null;
  promptVersion: string;
  usage: AIProviderUsage | null;
  durationMs: number | null;
  /** Friendly, user-safe message describing why the fallback was used (null when not applicable). */
  errorMessage: string | null;
}

export interface RunAgentParams<T> {
  agentName: string;
  promptVersion: string;
  buildSystemPrompt: () => string;
  buildUserPrompt: () => string;
  schema: ZodType<T>;
  /** Produces this agent's own simulated output. Must match `schema`. */
  fallback: () => T;
}

/**
 * Shared execution skeleton for every marketing agent: picks mock vs. live
 * mode, retries the real AI call with a timeout, re-validates the result
 * against the agent's own Zod schema, and falls back to the agent's own
 * simulated generator when the real call can't be trusted — without any
 * agent duplicating this retry/timeout/fallback/metrics plumbing itself.
 */
export async function runAgent<T>(params: RunAgentParams<T>): Promise<AgentRunResult<T>> {
  const config = getAiConfig();
  const providerName = process.env.AI_PROVIDER?.trim().toLowerCase() || "anthropic";

  if (config.mode === "mock" || !hasProviderApiKey()) {
    return {
      data: params.fallback(),
      usedFallback: true,
      retryCount: 0,
      provider: null,
      model: null,
      promptVersion: params.promptVersion,
      usage: null,
      durationMs: null,
      errorMessage: null,
    };
  }

  const provider = getAiProvider();
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await provider.generateStructuredOutput({
        agentName: params.agentName,
        systemPrompt: params.buildSystemPrompt(),
        userPrompt: params.buildUserPrompt(),
        schema: params.schema,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeoutMs: config.timeoutMs,
      });

      const validated = params.schema.safeParse(result.data);
      if (!validated.success) {
        throw new Error(`Resposta do agente "${params.agentName}" não passou na validação do schema.`);
      }

      return {
        data: validated.data,
        usedFallback: false,
        retryCount: attempt - 1,
        provider: providerName,
        model: result.model ?? null,
        promptVersion: params.promptVersion,
        usage: result.usage ?? null,
        durationMs: result.durationMs ?? null,
        errorMessage: null,
      };
    } catch (error) {
      lastError = error;
      console.error(`[agent-runner] "${params.agentName}" attempt ${attempt}/${config.maxRetries} failed:`, error);
      if (attempt < config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const technicalMessage = lastError instanceof Error ? lastError.message : "Erro desconhecido na chamada de IA.";
  console.error(`[agent-runner] "${params.agentName}" exhausted retries, using fallback:`, technicalMessage);

  return {
    data: params.fallback(),
    usedFallback: true,
    retryCount: config.maxRetries,
    provider: providerName,
    model: null,
    promptVersion: params.promptVersion,
    usage: null,
    durationMs: null,
    errorMessage: `Não foi possível executar o agente "${params.agentName}" com IA. Foi utilizada uma resposta simulada.`,
  };
}
