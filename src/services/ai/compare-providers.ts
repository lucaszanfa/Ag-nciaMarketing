import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { buildChiefEditorSystemPrompt, buildChiefEditorUserPrompt } from "./prompts/chief-editor.prompt";
import { chiefEditorPlanSchema, type ChiefEditorPlan } from "./schemas/chief-editor.schema";
import { getAiConfig } from "./config";
import type { AIProvider } from "./providers/ai-provider.interface";
import type { CompanyContext } from "./types";

export interface ProviderComparisonInput {
  originalRequest: string;
  company: CompanyContext;
}

export interface ProviderComparisonResult {
  providerLabel: string;
  plan: ChiefEditorPlan | null;
  model: string | null;
  durationMs: number | null;
  error: string | null;
}

/**
 * Belt-and-suspenders on top of the provider's own `timeoutMs` option: an unreachable LM Studio
 * server can hang past whatever timeout was requested (connection never even completes, so
 * there's nothing for the SDK's request-level timeout to cancel). Without this, one hung
 * provider would block `Promise.all` from ever resolving, silently freezing the *other*
 * provider's already-finished result too — this guarantees a result within `ms` regardless.
 */
function withHardTimeout<T>(promise: Promise<T>, ms: number, providerLabel: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Tempo limite excedido aguardando resposta do ${providerLabel}.`)), ms);
    }),
  ]);
}

// Capped well under a minute on purpose: this call is directly awaited by a client component
// (unlike the rest of the app, which always fires long AI work in the background via `after()`
// and polls for it) — keeping it comfortably under a minute avoids tripping any infra-level
// timeout on the request itself, not just the AI call.
const HARD_TIMEOUT_MS = 30000;

async function runChiefEditorWith(
  providerLabel: string,
  provider: AIProvider,
  input: ProviderComparisonInput
): Promise<ProviderComparisonResult> {
  const config = getAiConfig();
  const startedAt = Date.now();
  try {
    const result = await withHardTimeout(
      provider.generateStructuredOutput({
        agentName: "CHIEF_EDITOR",
        systemPrompt: buildChiefEditorSystemPrompt(),
        userPrompt: buildChiefEditorUserPrompt(input),
        schema: chiefEditorPlanSchema,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeoutMs: HARD_TIMEOUT_MS,
      }),
      HARD_TIMEOUT_MS,
      providerLabel
    );

    const validated = chiefEditorPlanSchema.safeParse(result.data);
    if (!validated.success) {
      throw new Error("A resposta não passou na validação do schema esperado.");
    }

    return {
      providerLabel,
      plan: validated.data,
      model: result.model ?? null,
      durationMs: result.durationMs ?? Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      providerLabel,
      plan: null,
      model: null,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Erro desconhecido na chamada de IA.",
    };
  }
}

/**
 * Runs the Chief Editor's planning step through Gemini and LM Studio side by side, independent
 * of whatever `AI_PROVIDER` is currently configured for the real project pipeline — so comparing
 * providers never requires touching `.env` or restarting the server. Scoped to the Chief Editor
 * only (not the full 6-agent pipeline): it's the one agent whose output is a single structured
 * call, cheap enough to run twice, and directly comparable between providers.
 */
export async function compareGeminiVsLmStudio(
  input: ProviderComparisonInput
): Promise<[ProviderComparisonResult, ProviderComparisonResult]> {
  const gemini = new GeminiProvider();
  const lmStudio = new OpenAIProvider({
    baseURL: process.env.LM_STUDIO_BASE_URL?.trim() ?? "",
    apiKey: "lm-studio",
    // Dedicated var so this always targets LM Studio's model regardless of what AI_MODEL is
    // currently set to for the active provider (shared var would otherwise hijack both sides).
    defaultModel: process.env.LM_STUDIO_MODEL?.trim() || "local-model",
  });

  const [geminiResult, lmStudioResult] = await Promise.all([
    runChiefEditorWith("Gemini", gemini, input),
    runChiefEditorWith("LM Studio", lmStudio, input),
  ]);

  return [geminiResult, lmStudioResult];
}
