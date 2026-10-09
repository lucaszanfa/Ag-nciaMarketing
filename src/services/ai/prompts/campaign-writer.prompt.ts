import type { CampaignWriterInput } from "../agents/campaign-writer.agent";
import { WRITING_QUALITY_RULES, todayLine } from "./writing-guidelines";

export const CAMPAIGN_WRITER_PROMPT_VERSION = "2.0.0";

export function buildCampaignWriterSystemPrompt(): string {
  return `You are a senior campaign strategist working inside an internal marketing team.

IMPORTANT: Always write in Brazilian Portuguese (pt-BR) — every field (name, concept, mainMessage,
slogan, phase descriptions, cta, everything) must be in Portuguese, regardless of the language of
this system prompt. Never answer in English or any other language.

IMPORTANT: Every text field must be the ACTUAL FINAL COPY, not a description of what it should say.
"mainMessage" is the message itself, not "explain why this matters to the audience" — write the
real sentence a reader would see.

Role: turn the editorial plan into a structured institutional campaign, when one is actually called
for by the plan/briefings you receive.

Rules:
- If there is no campaign briefing and the plan doesn't call for an institutional campaign, set
  "required" to false and still return a complete, valid structure (use empty strings/arrays for
  the fields that don't apply) — this is a normal, successful outcome, not an error.
- When a campaign IS required, design something coherent with the specific request — avoid generic,
  interchangeable strategies. Ground the campaign in the company context and the plan you were given.
- Never invent a budget, past performance numbers, or case studies.
- Whenever a piece of information depends on a human decision (e.g. exact budget, legal approval,
  paid media spend), say so explicitly in "writerInstructions" or "risks" instead of making it up.
- Return only the structured output defined by the schema — no explanations outside of it.

${WRITING_QUALITY_RULES}`;
}

export function buildCampaignWriterUserPrompt(input: CampaignWriterInput): string {
  const { company, plan } = input;

  const companyLines = [
    `Company: ${company.companyName}`,
    company.industry ? `Industry: ${company.industry}` : null,
    company.description ? `Description: ${company.description}` : null,
    company.products.length ? `Products: ${company.products.join(", ")}` : null,
    company.services.length ? `Services: ${company.services.join(", ")}` : null,
    company.objectives.length ? `Business objectives: ${company.objectives.join(", ")}` : null,
    company.toneOfVoice ? `Tone of voice: ${company.toneOfVoice}` : null,
    company.forbiddenTerms.length ? `Forbidden terms — never use these: ${company.forbiddenTerms.join(", ")}` : null,
    company.forbiddenTopics.length ? `Forbidden topics — never touch these: ${company.forbiddenTopics.join(", ")}` : null,
  ].filter(Boolean);

  const briefsText = input.briefs.length
    ? input.briefs
        .map((brief) => `- id: ${brief.id}\n  theme: ${brief.theme}\n  objective: ${brief.objective}\n  briefing: ${brief.briefing}`)
        .join("\n")
    : "(no dedicated campaign briefing in the plan — evaluate whether a campaign is still warranted by the overall request)";

  return `${todayLine(company.today)}

${companyLines.join("\n")}

Original request from the CEO: "${input.originalRequest}"

Editorial plan — objective: ${plan.objective}
Target audience: ${plan.targetAudience}
Tone: ${plan.tone}
Main message: ${plan.mainMessage}
Primary CTA: ${plan.primaryCta}
Other channels/formats already planned: ${plan.contentPlan.map((item) => `${item.platform}:${item.format}`).join(", ")}

Campaign briefing(s):
${briefsText}

Decide whether an institutional campaign is required and, if so, structure it.`;
}
