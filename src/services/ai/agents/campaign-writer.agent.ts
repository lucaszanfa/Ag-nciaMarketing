import type { MarketingAgent, CompanyContext, RevisableAgent, RevisionInput } from "../types";
import type { ChiefEditorPlan, ContentPlanItem } from "../schemas/chief-editor.schema";
import { campaignWriterOutputSchema, type CampaignWriterOutput } from "../schemas/campaign-writer.schema";
import {
  buildCampaignWriterSystemPrompt,
  buildCampaignWriterUserPrompt,
  CAMPAIGN_WRITER_PROMPT_VERSION,
} from "../prompts/campaign-writer.prompt";
import {
  buildCampaignWriterRevisionSystemPrompt,
  buildCampaignWriterRevisionUserPrompt,
  CAMPAIGN_WRITER_REVISION_PROMPT_VERSION,
} from "../prompts/campaign-writer-revision.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";
import { generateSimulatedCampaign, generateSimulatedCampaignRevision } from "./campaign-writer.simulated";

export interface CampaignWriterInput {
  originalRequest: string;
  plan: ChiefEditorPlan;
  briefs: ContentPlanItem[];
  company: CompanyContext;
}

export type CampaignWriterAgent = MarketingAgent<CampaignWriterInput, CampaignWriterOutput> &
  RevisableAgent<CampaignWriterOutput>;

class CampaignWriterAgentImpl implements CampaignWriterAgent {
  async execute(input: CampaignWriterInput): Promise<AgentRunResult<CampaignWriterOutput>> {
    return runAgent({
      agentName: "CAMPAIGN_WRITER",
      promptVersion: CAMPAIGN_WRITER_PROMPT_VERSION,
      buildSystemPrompt: buildCampaignWriterSystemPrompt,
      buildUserPrompt: () => buildCampaignWriterUserPrompt(input),
      schema: campaignWriterOutputSchema,
      fallback: () => generateSimulatedCampaign(input),
    });
  }

  async revise(input: RevisionInput<CampaignWriterOutput>): Promise<AgentRunResult<CampaignWriterOutput>> {
    return runAgent({
      agentName: "CAMPAIGN_WRITER_REVISION",
      promptVersion: CAMPAIGN_WRITER_REVISION_PROMPT_VERSION,
      buildSystemPrompt: buildCampaignWriterRevisionSystemPrompt,
      buildUserPrompt: () => buildCampaignWriterRevisionUserPrompt(input),
      schema: campaignWriterOutputSchema,
      fallback: () => generateSimulatedCampaignRevision(input),
    });
  }
}

export const campaignWriterAgent: CampaignWriterAgent = new CampaignWriterAgentImpl();
