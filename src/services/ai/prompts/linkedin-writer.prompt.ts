import type { LinkedInWriterInput } from "../agents/linkedin-writer.agent";

export const LINKEDIN_WRITER_PROMPT_VERSION = "1.0.0";

export function buildLinkedInWriterSystemPrompt(): string {
  return `You are a senior LinkedIn copywriter working inside an internal marketing team.

Role: turn each content-plan briefing assigned to LinkedIn into a ready-to-publish LinkedIn post.

Objective: produce one structured post per briefing you receive, respecting the Chief Editor's
plan (objective, theme, tone) and the company's context.

Rules:
- Respect the company's tone of voice, preferred/forbidden terms and allowed/forbidden topics.
- Never invent numbers, client names, case studies, or results that weren't given to you.
- Never make claims that aren't grounded in the company context or the briefing.
- Write native LinkedIn language: no generic filler, vary hooks and structure across posts, make
  every post genuinely usable as-is.
- Every post must reference the "briefId" of the briefing it answers to (echo it back exactly).
- Return only the structured output defined by the schema — no explanations outside of it.

Quality bar: clear hook in the first line, a body that delivers on the hook, a single unambiguous
CTA, hashtags relevant to the theme, and a concrete visual suggestion (no image generation, just a
short description of what should accompany the post).`;
}

export function buildLinkedInWriterUserPrompt(input: LinkedInWriterInput): string {
  const { company, plan } = input;

  const companyLines = [
    `Company: ${company.companyName}`,
    company.industry ? `Industry: ${company.industry}` : null,
    company.description ? `Description: ${company.description}` : null,
    company.products.length ? `Products: ${company.products.join(", ")}` : null,
    company.services.length ? `Services: ${company.services.join(", ")}` : null,
    company.toneOfVoice ? `Tone of voice: ${company.toneOfVoice}` : null,
    company.preferredTerms.length ? `Preferred terms: ${company.preferredTerms.join(", ")}` : null,
    company.forbiddenTerms.length ? `Forbidden terms — never use these: ${company.forbiddenTerms.join(", ")}` : null,
    company.forbiddenTopics.length ? `Forbidden topics — never touch these: ${company.forbiddenTopics.join(", ")}` : null,
    company.defaultCta ? `Default CTA to consider: ${company.defaultCta}` : null,
    company.hashtags.length ? `Brand hashtags to consider: ${company.hashtags.join(", ")}` : null,
  ].filter(Boolean);

  const briefsText = input.briefs
    .map(
      (brief) =>
        `- id: ${brief.id}\n  theme: ${brief.theme}\n  objective: ${brief.objective}\n  format: ${brief.format}\n  briefing: ${brief.briefing}\n  suggestedDate: ${brief.suggestedDate}`
    )
    .join("\n");

  return `${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"

Editorial plan — objective: ${plan.objective}
Target audience: ${plan.targetAudience}
Tone: ${plan.tone}
Main message: ${plan.mainMessage}
Primary CTA: ${plan.primaryCta}

LinkedIn briefings to write (one post per briefing, same "id" as "briefId"):
${briefsText}

Produce the LinkedIn posts for these briefings.`;
}
