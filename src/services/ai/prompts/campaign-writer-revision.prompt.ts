import type { RevisionInput } from "../types";
import { WRITING_QUALITY_RULES, todayLine } from "./writing-guidelines";
import type { CampaignWriterOutput } from "../schemas/campaign-writer.schema";

export const CAMPAIGN_WRITER_REVISION_PROMPT_VERSION = "2.0.0";

export function buildCampaignWriterRevisionSystemPrompt(): string {
  return `You are the same campaign strategist, now correcting a campaign you already structured
based on feedback from the Reviewer.

IMPORTANT: Always write in Brazilian Portuguese (pt-BR), regardless of the language of this system
prompt. Every field must be the ACTUAL FINAL COPY, never a description of what it should say.

Rules:
- Preserve the original concept and objective — you are revising this campaign, not designing a
  new one, unless the Reviewer's feedback specifically says the concept itself is the problem.
- Fix only what the Reviewer's problems/suggestions/correction instructions point at; keep
  everything else (phases, channels, pieces) that wasn't flagged.
- Never invent a budget, past performance numbers, or case studies.
- Keep "required" as it was unless the correction instructions say otherwise.
- Return only the structured output defined by the campaign schema — no explanations outside of
  it.

${WRITING_QUALITY_RULES}`;
}

export function buildCampaignWriterRevisionUserPrompt(input: RevisionInput<CampaignWriterOutput>): string {
  const { companyContext: company, review } = input;

  const companyLines = [
    `Company: ${company.companyName}`,
    company.toneOfVoice ? `Tone of voice: ${company.toneOfVoice}` : null,
    company.forbiddenTerms.length ? `Forbidden terms — never use these: ${company.forbiddenTerms.join(", ")}` : null,
  ].filter(Boolean);

  return `${todayLine(company.today)}

${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"

Current campaign (attempt ${input.revisionAttempt} of ${input.maxAutomaticRevisions}):
${JSON.stringify(input.originalContent, null, 2)}

Reviewer's evaluation of this version:
- Overall score: ${review.overallScore}
- Problems: ${review.problems.join("; ") || "none"}
- Suggestions: ${review.suggestions.join("; ") || "none"}
- Correction instructions: ${review.correctionInstructions.join("; ") || "none"}

Produce a corrected version of this campaign, addressing the correction instructions above without
discarding what already worked.`;
}
