import type { MarketingAgent, CompanyContext } from "../types";
import { newsCuratorOutputSchema, type NewsCuratorOutput } from "../schemas/news-curator.schema";
import {
  buildNewsCuratorSystemPrompt,
  buildNewsCuratorUserPrompt,
  NEWS_CURATOR_PROMPT_VERSION,
} from "../prompts/news-curator.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";

export interface NewsCandidate {
  headline: string;
  source?: string;
  publishedAt?: string;
}

export interface NewsCuratorInput {
  candidates: NewsCandidate[];
  company: CompanyContext;
}

export type NewsCuratorAgent = MarketingAgent<NewsCuratorInput, NewsCuratorOutput>;

class NewsCuratorAgentImpl implements NewsCuratorAgent {
  async execute(input: NewsCuratorInput): Promise<AgentRunResult<NewsCuratorOutput>> {
    return runAgent({
      agentName: "NEWS_CURATOR",
      promptVersion: NEWS_CURATOR_PROMPT_VERSION,
      buildSystemPrompt: buildNewsCuratorSystemPrompt,
      buildUserPrompt: () => buildNewsCuratorUserPrompt(input),
      schema: newsCuratorOutputSchema,
      // No simulated curation: picking news at random is exactly the failure this agent exists
      // to prevent, so without a working AI nothing gets selected.
      fallback: () => ({ evaluations: [] }),
    });
  }
}

export const newsCuratorAgent: NewsCuratorAgent = new NewsCuratorAgentImpl();
