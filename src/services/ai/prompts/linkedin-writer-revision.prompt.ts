import type { RevisionInput } from "../types";
import type { LinkedInPost } from "../schemas/linkedin-writer.schema";

export const LINKEDIN_WRITER_REVISION_PROMPT_VERSION = "1.0.0";

export function buildLinkedInWriterRevisionSystemPrompt(): string {
  return `You are the same senior LinkedIn copywriter, now correcting a post you already wrote based
on feedback from the Reviewer.

IMPORTANT: Always write in Brazilian Portuguese (pt-BR), regardless of the language of this system
prompt. Every field must be the ACTUAL FINAL TEXT to publish, never a description of what to write.

Rules:
- Preserve the original objective, audience and briefId — you are revising this post, not writing
  a new one.
- Keep everything that already works; fix only what the Reviewer's problems/suggestions/correction
  instructions point at.
- Do not ignore any correction instruction given.
- Never invent numbers, client names, case studies, or results.
- Do not remove relevant content without a reason tied to a reported problem.
- Keep the same "format" (POST/ARTICLE/POLL) and respect the company's tone of voice, preferred and
  forbidden terms.
- Return only the structured output defined by the schema (the same single-post schema as before)
  — no explanations outside of it.`;
}

export function buildLinkedInWriterRevisionUserPrompt(input: RevisionInput<LinkedInPost>): string {
  const { companyContext: company, editorialPlan: plan, review } = input;

  const companyLines = [
    `Company: ${company.companyName}`,
    company.toneOfVoice ? `Tone of voice: ${company.toneOfVoice}` : null,
    company.forbiddenTerms.length ? `Forbidden terms — never use these: ${company.forbiddenTerms.join(", ")}` : null,
    company.forbiddenTopics.length ? `Forbidden topics: ${company.forbiddenTopics.join(", ")}` : null,
  ].filter(Boolean);

  const previousAttemptsText = input.previousReviews
    .map((r, i) => `Attempt ${i} review — problems: ${r.problems.join("; ") || "none"}`)
    .join("\n");

  return `${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"
Editorial plan objective: ${plan.objective} | Tone: ${plan.tone} | Primary CTA: ${plan.primaryCta}

Current post (attempt ${input.revisionAttempt} of ${input.maxAutomaticRevisions}):
${JSON.stringify(input.originalContent, null, 2)}

Reviewer's evaluation of this version:
- Overall score: ${review.overallScore}
- Problems: ${review.problems.join("; ") || "none"}
- Suggestions: ${review.suggestions.join("; ") || "none"}
- Correction instructions: ${review.correctionInstructions.join("; ") || "none"}
${review.suggestedRevision ? `- Reviewer's suggested rewrite: ${review.suggestedRevision}` : ""}

${previousAttemptsText ? `Earlier attempts on this same content:\n${previousAttemptsText}\n` : ""}
Produce a corrected version of this exact post (same briefId), addressing the correction
instructions above without discarding what already worked.`;
}
