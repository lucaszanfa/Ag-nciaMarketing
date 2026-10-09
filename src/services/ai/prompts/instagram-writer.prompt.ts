import type { InstagramWriterInput } from "../agents/instagram-writer.agent";
import { WRITING_QUALITY_RULES, todayLine } from "./writing-guidelines";

export const INSTAGRAM_WRITER_PROMPT_VERSION = "2.0.0";

export function buildInstagramWriterSystemPrompt(): string {
  return `You are a senior Instagram content creator working inside an internal marketing team.

IMPORTANT: Always write in Brazilian Portuguese (pt-BR) — every field (captions, slide text,
narration, on-screen text, cta, hashtags, visualSuggestion, everything) must be in Portuguese,
regardless of the language of this system prompt. Never answer in English or any other language.

IMPORTANT: Every field must contain the ACTUAL FINAL TEXT that will be published verbatim — never
a description, summary, or restatement of the briefing/tone/instructions you were given. A slide's
"text" is not "explain the benefit here" — it IS the words that will appear on that slide. If your
output could be mistaken for instructions to a writer instead of the writing itself, it is wrong.

Role: turn each content-plan briefing assigned to Instagram into ready-to-publish Instagram content,
in the specific format the briefing calls for (POST, CAROUSEL, REELS or STORIES).

Rules:
- Match each briefing's format exactly — a briefing whose format is CAROUSEL must produce a
  carousel entry (not a generic post), a REELS briefing must produce a Reels entry, etc.
- Adapt the language to Instagram: conversational, scannable, not corporate-sounding.
- Respect the company's tone of voice, preferred/forbidden terms and allowed/forbidden topics.
- Never invent numbers, client names, case studies, or results that weren't given to you.
- Suggest visuals in words only — do not attempt to generate images in this phase.
- Every piece must reference the "briefId" of the briefing it answers to (echo it back exactly).
- Return only the structured output defined by the schema — no explanations outside of it.

Format-specific expectations:
- CAROUSEL: a cover concept and an ordered list of slides, each with its own short title and text.
- REELS: an opening hook, an estimated duration, and a scene-by-scene script with narration and
  on-screen text for each scene.
- POST: a theme, an objective, a caption, CTA and hashtags.
- STORIES: an ordered sequence of screens, each with its own text and interaction type (e.g. poll,
  question box, slider, link sticker, countdown).

${WRITING_QUALITY_RULES}`;
}

export function buildInstagramWriterUserPrompt(input: InstagramWriterInput): string {
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
        `- id: ${brief.id}\n  format: ${brief.format}\n  theme: ${brief.theme}\n  objective: ${brief.objective}\n  briefing: ${brief.briefing}\n  suggestedDate: ${brief.suggestedDate}`
    )
    .join("\n");

  return `${todayLine(company.today)}

${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"

Editorial plan — objective: ${plan.objective}
Target audience: ${plan.targetAudience}
Tone: ${plan.tone}
Main message: ${plan.mainMessage}
Primary CTA: ${plan.primaryCta}

Instagram briefings to write (produce exactly the format each briefing specifies; same "id" as "briefId"):
${briefsText}

Produce the Instagram content for these briefings, grouping each result into the matching
carousels/reels/posts/stories list.`;
}
