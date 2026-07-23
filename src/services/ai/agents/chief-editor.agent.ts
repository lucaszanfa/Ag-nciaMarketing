import type { MarketingAgent, CompanyContext } from "../types";
import { chiefEditorPlanSchema, type ChiefEditorPlan } from "../schemas/chief-editor.schema";
import {
  buildChiefEditorSystemPrompt,
  buildChiefEditorUserPrompt,
  CHIEF_EDITOR_PROMPT_VERSION,
} from "../prompts/chief-editor.prompt";
import { runAgent, type AgentRunResult } from "../agent-runner";
import { generateSimulatedChiefEditorPlan } from "./chief-editor.simulated";

export interface ChiefEditorInput {
  originalRequest: string;
  company: CompanyContext;
}

export type ChiefEditorAgent = MarketingAgent<ChiefEditorInput, ChiefEditorPlan>;

class ChiefEditorAgentImpl implements ChiefEditorAgent {
  async execute(input: ChiefEditorInput): Promise<AgentRunResult<ChiefEditorPlan>> {
    return runAgent({
      agentName: "CHIEF_EDITOR",
      promptVersion: CHIEF_EDITOR_PROMPT_VERSION,
      buildSystemPrompt: buildChiefEditorSystemPrompt,
      buildUserPrompt: () => buildChiefEditorUserPrompt(input),
      schema: chiefEditorPlanSchema,
      fallback: () => generateSimulatedChiefEditorPlan(input),
    });
  }
}

export const chiefEditorAgent: ChiefEditorAgent = new ChiefEditorAgentImpl();
