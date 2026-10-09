import type { RevisionInput } from "../types";
import { WRITING_QUALITY_RULES, todayLine } from "./writing-guidelines";
import type { InstagramCarousel, InstagramPost, InstagramReels, InstagramStory } from "../schemas/instagram-writer.schema";

export type InstagramContent = InstagramCarousel | InstagramReels | InstagramPost | InstagramStory;

export const INSTAGRAM_WRITER_REVISION_PROMPT_VERSION = "2.0.0";

export function buildInstagramWriterRevisionSystemPrompt(): string {
  return `You are the same senior Instagram content creator, now correcting a piece you already
wrote based on feedback from the Reviewer.

IMPORTANT: Always write in Brazilian Portuguese (pt-BR), regardless of the language of this system
prompt. Every field must be the ACTUAL FINAL TEXT to publish, never a description of what to write.

Rules:
- Preserve the original briefId, format and objective — you are revising this piece, not writing a
  new one from scratch.
- Keep the exact same structure for its format (a CAROUSEL revision must still be a carousel with
  slides, a REELS revision must still have a scene-by-scene script, etc.).
- Keep everything that already works; fix only what the Reviewer's problems/suggestions/correction
  instructions point at. Do not ignore any correction instruction given.
- Never invent numbers, client names, case studies, or results.
- Respect the company's tone of voice and forbidden terms/topics.
- Return only the structured output defined by the schema for this exact format — no explanations
  outside of it.

${WRITING_QUALITY_RULES}`;
}

export function buildInstagramWriterRevisionUserPrompt(input: RevisionInput<InstagramContent>): string {
  const { companyContext: company, editorialPlan: plan, review } = input;

  const companyLines = [
    `Company: ${company.companyName}`,
    company.toneOfVoice ? `Tone of voice: ${company.toneOfVoice}` : null,
    company.forbiddenTerms.length ? `Forbidden terms — never use these: ${company.forbiddenTerms.join(", ")}` : null,
  ].filter(Boolean);

  return `${todayLine(company.today)}

${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"
Editorial plan objective: ${plan.objective} | Tone: ${plan.tone} | Primary CTA: ${plan.primaryCta}

Format being revised: ${input.format}

Current content (attempt ${input.revisionAttempt} of ${input.maxAutomaticRevisions}):
${JSON.stringify(input.originalContent, null, 2)}

Reviewer's evaluation of this version:
- Overall score: ${review.overallScore}
- Problems: ${review.problems.join("; ") || "none"}
- Suggestions: ${review.suggestions.join("; ") || "none"}
- Correction instructions: ${review.correctionInstructions.join("; ") || "none"}
${review.suggestedRevision ? `- Reviewer's suggested rewrite: ${review.suggestedRevision}` : ""}

Produce a corrected version of this exact ${input.format} piece (same briefId), addressing the
correction instructions above without discarding what already worked.`;
}
