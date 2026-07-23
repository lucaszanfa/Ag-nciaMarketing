import type { MarketingAgent, CompanyContext, RevisableAgent, RevisionInput } from "../types";
import type { ChiefEditorPlan, ContentPlanItem } from "../schemas/chief-editor.schema";
import { linkedInPostSchema, linkedInWriterOutputSchema, type LinkedInPost, type LinkedInWriterOutput } from "../schemas/linkedin-writer.schema";
import {
  buildLinkedInWriterSystemPrompt,
  buildLinkedInWriterUserPrompt,
  LINKEDIN_WRITER_PROMPT_VERSION,
} from "../prompts/linkedin-writer.prompt";
import {
  buildLinkedInWriterRevisionSystemPrompt,
  buildLinkedInWriterRevisionUserPrompt,
  LINKEDIN_WRITER_REVISION_PROMPT_VERSION,
} from "../prompts/linkedin-writer-revision.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";
import { generateSimulatedLinkedInContent, generateSimulatedLinkedInRevision } from "./linkedin-writer.simulated";

export interface LinkedInWriterInput {
  originalRequest: string;
  plan: ChiefEditorPlan;
  briefs: ContentPlanItem[];
  company: CompanyContext;
}

export type LinkedInWriterAgent = MarketingAgent<LinkedInWriterInput, LinkedInWriterOutput> & RevisableAgent<LinkedInPost>;

class LinkedInWriterAgentImpl implements LinkedInWriterAgent {
  async execute(input: LinkedInWriterInput): Promise<AgentRunResult<LinkedInWriterOutput>> {
    return runAgent({
      agentName: "LINKEDIN_WRITER",
      promptVersion: LINKEDIN_WRITER_PROMPT_VERSION,
      buildSystemPrompt: buildLinkedInWriterSystemPrompt,
      buildUserPrompt: () => buildLinkedInWriterUserPrompt(input),
      schema: linkedInWriterOutputSchema,
      fallback: () => generateSimulatedLinkedInContent(input),
    });
  }

  async revise(input: RevisionInput<LinkedInPost>): Promise<AgentRunResult<LinkedInPost>> {
    return runAgent({
      agentName: "LINKEDIN_WRITER_REVISION",
      promptVersion: LINKEDIN_WRITER_REVISION_PROMPT_VERSION,
      buildSystemPrompt: buildLinkedInWriterRevisionSystemPrompt,
      buildUserPrompt: () => buildLinkedInWriterRevisionUserPrompt(input),
      schema: linkedInPostSchema,
      fallback: () => generateSimulatedLinkedInRevision(input),
    });
  }
}

export const linkedInWriterAgent: LinkedInWriterAgent = new LinkedInWriterAgentImpl();
