import type { ZodType } from "zod";
import type { MarketingAgent, CompanyContext, RevisableAgent, RevisionInput } from "../types";
import type { ChiefEditorPlan, ContentPlanItem } from "../schemas/chief-editor.schema";
import {
  instagramCarouselSchema,
  instagramPostSchema,
  instagramReelsSchema,
  instagramStorySchema,
  instagramWriterOutputSchema,
  type InstagramWriterOutput,
} from "../schemas/instagram-writer.schema";
import {
  buildInstagramWriterSystemPrompt,
  buildInstagramWriterUserPrompt,
  INSTAGRAM_WRITER_PROMPT_VERSION,
} from "../prompts/instagram-writer.prompt";
import {
  buildInstagramWriterRevisionSystemPrompt,
  buildInstagramWriterRevisionUserPrompt,
  INSTAGRAM_WRITER_REVISION_PROMPT_VERSION,
  type InstagramContent,
} from "../prompts/instagram-writer-revision.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";
import { generateSimulatedInstagramContent, generateSimulatedInstagramRevision } from "./instagram-writer.simulated";
import type { ContentFormat } from "@/types/enums";

export interface InstagramWriterInput {
  originalRequest: string;
  plan: ChiefEditorPlan;
  briefs: ContentPlanItem[];
  company: CompanyContext;
}

export type InstagramWriterAgent = MarketingAgent<InstagramWriterInput, InstagramWriterOutput> &
  RevisableAgent<InstagramContent>;

function schemaForFormat(format: ContentFormat): ZodType<InstagramContent> {
  if (format === "CAROUSEL") return instagramCarouselSchema as unknown as ZodType<InstagramContent>;
  if (format === "REELS") return instagramReelsSchema as unknown as ZodType<InstagramContent>;
  if (format === "STORIES") return instagramStorySchema as unknown as ZodType<InstagramContent>;
  return instagramPostSchema as unknown as ZodType<InstagramContent>;
}

class InstagramWriterAgentImpl implements InstagramWriterAgent {
  async execute(input: InstagramWriterInput): Promise<AgentRunResult<InstagramWriterOutput>> {
    return runAgent({
      agentName: "INSTAGRAM_WRITER",
      promptVersion: INSTAGRAM_WRITER_PROMPT_VERSION,
      buildSystemPrompt: buildInstagramWriterSystemPrompt,
      buildUserPrompt: () => buildInstagramWriterUserPrompt(input),
      schema: instagramWriterOutputSchema,
      fallback: () => generateSimulatedInstagramContent(input),
    });
  }

  async revise(input: RevisionInput<InstagramContent>): Promise<AgentRunResult<InstagramContent>> {
    return runAgent({
      agentName: "INSTAGRAM_WRITER_REVISION",
      promptVersion: INSTAGRAM_WRITER_REVISION_PROMPT_VERSION,
      buildSystemPrompt: buildInstagramWriterRevisionSystemPrompt,
      buildUserPrompt: () => buildInstagramWriterRevisionUserPrompt(input),
      schema: schemaForFormat(input.format),
      fallback: () => generateSimulatedInstagramRevision(input),
    });
  }
}

export const instagramWriterAgent: InstagramWriterAgent = new InstagramWriterAgentImpl();
