export type AiMode = "live" | "mock";

export interface AiConfig {
  mode: AiMode;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
  maxAutomaticRevisions: number;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const MIN_AUTOMATIC_REVISIONS = 0;
const MAX_AUTOMATIC_REVISIONS_CEILING = 5;
const DEFAULT_AUTOMATIC_REVISIONS = 2;

/**
 * Safe reader for the per-content automatic-revision cap: never trusts the raw
 * env string directly, clamps it to a sane range, and falls back to the
 * default on anything invalid (non-numeric, negative, or absurdly high).
 */
export function getMaxAutomaticRevisions(): number {
  const raw = process.env.AI_MAX_AUTOMATIC_REVISIONS;
  if (!raw?.trim()) return DEFAULT_AUTOMATIC_REVISIONS;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed)) return DEFAULT_AUTOMATIC_REVISIONS;

  return Math.min(Math.max(parsed, MIN_AUTOMATIC_REVISIONS), MAX_AUTOMATIC_REVISIONS_CEILING);
}

/**
 * Central place every agent reads its run-mode/tuning from, so behavior stays
 * consistent without each `*.agent.ts` re-parsing `process.env` itself.
 */
export function getAiConfig(): AiConfig {
  const explicitMode = process.env.AI_MODE?.trim().toLowerCase();

  return {
    mode: explicitMode === "mock" || explicitMode === "live" ? explicitMode : "live",
    temperature: parseNumber(process.env.AI_TEMPERATURE, 0.7),
    maxTokens: parseNumber(process.env.AI_MAX_TOKENS, 4000),
    timeoutMs: parseNumber(process.env.AI_TIMEOUT_MS, 60000),
    maxRetries: parseNumber(process.env.AI_MAX_RETRIES, 2),
    maxAutomaticRevisions: getMaxAutomaticRevisions(),
  };
}

/** Name of the env var whose presence enables real AI for the currently selected provider. */
export function currentProviderKeyName(): "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "GEMINI_API_KEY" | "LM_STUDIO_BASE_URL" {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (provider === "openai") return "OPENAI_API_KEY";
  if (provider === "gemini") return "GEMINI_API_KEY";
  if (provider === "lmstudio") return "LM_STUDIO_BASE_URL";
  return "ANTHROPIC_API_KEY";
}

/** Whether the selected provider has an API key configured. */
export function hasProviderApiKey(): boolean {
  return Boolean(process.env[currentProviderKeyName()]?.trim());
}
