import type { AgentRunResult } from "../agent-runner";
import type { ChiefEditorPlan } from "../schemas/chief-editor.schema";
import type { ContentReview } from "../schemas/reviewer.schema";
import type { ContentFormat, ContentVersionSource, Platform } from "@/types/enums";

/**
 * Contract every marketing agent implements — either backed by a real LLM
 * call (Anthropic/OpenAI) or, transparently, by that same agent's own
 * simulated fallback. `execute()` always returns the run's metrics
 * (provider/model/tokens/retries/fallback) alongside the validated output so
 * the Workflow Runner can persist them without any agent-specific branching.
 */
export interface MarketingAgent<TInput, TOutput> {
  execute(input: TInput): Promise<AgentRunResult<TOutput>>;
}

/** A single content item's prior version, for agents' `revise()` to see what already changed. */
export interface PreviousContentVersion {
  versionNumber: number;
  contentData: unknown;
  source: ContentVersionSource;
}

/**
 * Contract for the writer agents' correction method — reused by LinkedIn,
 * Instagram and Campaign agents. `TContent` is the *single-item* schema type
 * (e.g. `LinkedInPost`, not `LinkedInWriterOutput`), since a revision always
 * targets one already-generated piece of content, never a whole batch.
 */
export interface RevisionInput<TContent> {
  projectId: string;
  originalRequest: string;
  companyContext: CompanyContext;
  editorialPlan: ChiefEditorPlan;
  platform: Platform;
  format: ContentFormat;
  originalContent: TContent;
  currentVersion: number;
  review: ContentReview;
  previousReviews: ContentReview[];
  previousVersions: PreviousContentVersion[];
  revisionAttempt: number;
  maxAutomaticRevisions: number;
}

export interface RevisableAgent<TContent> {
  revise(input: RevisionInput<TContent>): Promise<AgentRunResult<TContent>>;
}

export interface CompanyContext {
  companyName: string;
  description?: string | null;
  industry?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  products: string[];
  services: string[];
  objectives: string[];
  preferredTerms: string[];
  forbiddenTerms: string[];
  allowedTopics: string[];
  forbiddenTopics: string[];
  defaultCta?: string | null;
  hashtags: string[];
  website?: string | null;
  socialNetworks: Record<string, string>;
}
