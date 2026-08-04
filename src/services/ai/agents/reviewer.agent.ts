import type { MarketingAgent, CompanyContext } from "../types";
import { reviewerOutputSchema, type ReviewerOutput } from "../schemas/reviewer.schema";
import { buildReviewerSystemPrompt, buildReviewerUserPrompt, REVIEWER_PROMPT_VERSION } from "../prompts/reviewer.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";
import { generateSimulatedReview } from "./reviewer.simulated";

export interface ReviewableContent {
  id: string;
  platform: string;
  format: string;
  title: string;
  /** Plain-text rendering of the content's body, so the reviewer can actually judge the writing. */
  contentText: string;
  /** Present only when re-reviewing a version produced by an automatic correction round. */
  previousReview?: {
    attempt: number;
    problems: string[];
    suggestions: string[];
  };
}

export interface ReviewerInput {
  originalRequest: string;
  contents: ReviewableContent[];
  company: CompanyContext;
}

export type ReviewerAgent = MarketingAgent<ReviewerInput, ReviewerOutput>;

class ReviewerAgentImpl implements ReviewerAgent {
  async execute(input: ReviewerInput): Promise<AgentRunResult<ReviewerOutput>> {
    return runAgent({
      agentName: "REVIEWER",
      promptVersion: REVIEWER_PROMPT_VERSION,
      buildSystemPrompt: buildReviewerSystemPrompt,
      buildUserPrompt: () => buildReviewerUserPrompt(input),
      schema: reviewerOutputSchema,
      fallback: () => generateSimulatedReview(input),
    });
  }
}

export const reviewerAgent: ReviewerAgent = new ReviewerAgentImpl();
