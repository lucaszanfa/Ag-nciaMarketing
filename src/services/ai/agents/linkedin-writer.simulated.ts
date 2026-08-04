import { dedupe, pickOne } from "@/lib/random";
import type { LinkedInWriterInput } from "./linkedin-writer.agent";
import type { LinkedInPost, LinkedInWriterOutput } from "../schemas/linkedin-writer.schema";
import type { RevisionInput } from "../types";

// Used whenever the AI call isn't available/reliable, so the workflow can
// still be exercised end-to-end with varied, briefing-aware simulated posts.
const HOOKS = [
  "Você já parou para pensar no custo de não fazer isso?",
  "3 em cada 5 empresas do setor ainda erram aqui.",
  "Isso mudou completamente a forma como atendemos nossos clientes.",
  "Ninguém fala sobre isso, mas deveria.",
  "Um detalhe pequeno que muda o resultado inteiro.",
];

const VISUALS = [
  "Carrossel com dado estatístico em destaque",
  "Foto da equipe em ambiente real de trabalho",
  "Ilustração simples com o CTA em destaque",
  "Gráfico comparativo antes/depois",
];

function buildBody(theme: string, briefing: string, company: LinkedInWriterInput["company"]): string {
  return (
    `Na ${company.companyName}, vemos de perto o impacto de ${theme.toLowerCase()} no dia a dia dos nossos clientes. ` +
    `${briefing} ` +
    `Compartilhamos essa perspectiva porque acreditamos em transparência e em construir relações de confiança com quem nos acompanha.`
  );
}

export function generateSimulatedLinkedInContent(input: LinkedInWriterInput): LinkedInWriterOutput {
  const briefs = input.briefs.length > 0 ? input.briefs : [
    {
      id: "li-fallback-1",
      platform: "LINKEDIN" as const,
      format: "POST" as const,
      theme: input.plan.contentPlan[0]?.theme ?? "Novidades da empresa",
      objective: input.plan.objective,
      briefing: input.plan.summary,
      suggestedDate: new Date().toISOString().slice(0, 10),
    },
  ];

  const posts: LinkedInPost[] = briefs.map((brief) => ({
    briefId: brief.id,
    internalTitle: `Post LinkedIn — ${brief.theme}`,
    objective: brief.objective,
    audience: input.plan.targetAudience,
    format: "POST",
    hook: pickOne(HOOKS),
    body: buildBody(brief.theme, brief.briefing, input.company),
    cta: input.plan.primaryCta,
    hashtags: dedupe(
      [`#${input.company.companyName.replace(/\s+/g, "")}`, ...input.company.hashtags.slice(0, 3), "#Marketing"].filter(
        Boolean
      )
    ),
    visualSuggestion: pickOne(VISUALS),
    strategicNotes: [
      "Conteúdo gerado em modo simulado (sem chave de IA configurada ou após falha da chamada real).",
    ],
  }));

  return { posts };
}

/**
 * Simulated correction: actually reacts to the Reviewer's feedback instead of
 * echoing the same post back — swaps the hook/visual (varies the result),
 * tightens the CTA when that was flagged, and appends a corrected closing
 * line addressing the reported problems.
 */
export function generateSimulatedLinkedInRevision(input: RevisionInput<LinkedInPost>): LinkedInPost {
  const { review, originalContent } = input;
  const addressedNotes = review.problems.length
    ? [`Correção simulada (tentativa ${input.revisionAttempt}) — ajustes feitos: ${review.problems.join("; ")}`]
    : [`Correção simulada (tentativa ${input.revisionAttempt}).`];

  const ctaNeedsWork = review.problems.some((p) => /cta/i.test(p)) || review.ctaScore < 85;
  const cta = ctaNeedsWork ? `${input.editorialPlan.primaryCta} — fale com nosso time ainda hoje` : originalContent.cta;

  const body = review.suggestions.length
    ? `${originalContent.body}\n\nAjuste com base na revisão: ${review.suggestions[0]}`
    : originalContent.body;

  return {
    ...originalContent,
    hook: pickOne(HOOKS.filter((h) => h !== originalContent.hook)) || originalContent.hook,
    body,
    cta,
    visualSuggestion: pickOne(VISUALS.filter((v) => v !== originalContent.visualSuggestion)) || originalContent.visualSuggestion,
    strategicNotes: dedupe([...originalContent.strategicNotes, ...addressedNotes]),
  };
}
