import { pickOne } from "@/lib/random";
import type { CampaignWriterInput } from "./campaign-writer.agent";
import type { CampaignWriterOutput } from "../schemas/campaign-writer.schema";
import type { RevisionInput } from "../types";

const CONCEPTS = [
  "Mostrar, na prática, o antes e depois de quem trabalha com a gente",
  "Aproximar a marca do dia a dia real do público, com histórias autênticas",
  "Reforçar autoridade no setor através de dados e bastidores",
];

export function generateSimulatedCampaign(input: CampaignWriterInput): CampaignWriterOutput {
  if (input.briefs.length === 0) {
    return {
      required: false,
      name: "",
      concept: "",
      objective: "",
      slogan: null,
      mainMessage: "",
      targetAudience: "",
      durationWeeks: 1,
      phases: [],
      channels: [],
      cta: "",
      pieceIdeas: [],
      schedule: [],
      recommendedMetrics: [],
      risks: [],
      writerInstructions: ["O planejamento editorial não indicou a necessidade de uma campanha institucional."],
    };
  }

  const theme = input.briefs[0]?.theme ?? input.plan.contentPlan[0]?.theme ?? "Novidades";
  const durationWeeks = Math.max(2, Math.ceil(input.plan.contentPlan.length / 2));
  const phaseWeeks = Math.max(1, Math.floor(durationWeeks / 3));
  const channels = Array.from(new Set(input.plan.contentPlan.map((item) => item.platform)));

  return {
    required: true,
    name: `Campanha ${input.company.companyName} — ${theme}`,
    concept: pickOne(CONCEPTS),
    objective: input.plan.objective,
    slogan: null,
    mainMessage: `${input.company.companyName} entrega ${theme.toLowerCase()} para ${input.plan.targetAudience.toLowerCase()}.`,
    targetAudience: input.plan.targetAudience,
    durationWeeks,
    phases: [
      {
        name: "Teaser",
        description: "Gerar curiosidade e aquecer a audiência",
        durationWeeks: phaseWeeks,
        actions: ["Publicar conteúdo de bastidores", "Anunciar novidade sem revelar detalhes"],
      },
      {
        name: "Lançamento",
        description: "Anunciar a mensagem principal em todos os canais",
        durationWeeks: phaseWeeks,
        actions: ["Publicar peça principal em todos os canais", "Reforçar CTA nos stories/posts"],
      },
      {
        name: "Sustentação",
        description: "Reforçar prova social e converter interessados",
        durationWeeks: Math.max(1, durationWeeks - phaseWeeks * 2),
        actions: ["Compartilhar depoimentos/reações", "Reforçar CTA para quem ainda não converteu"],
      },
    ],
    channels,
    cta: input.plan.primaryCta,
    pieceIdeas: [
      "Vídeo institucional curto (30-45s)",
      "Landing page de campanha com formulário de contato",
      "Sequência de e-mails para leads capturados",
      "Banner para assinatura de e-mail da equipe",
    ],
    schedule: [
      { period: "Semana 1", action: "Teaser nas redes", channel: channels[0] ?? "GENERAL" },
      { period: `Semana ${phaseWeeks + 1}`, action: "Lançamento da campanha", channel: channels[0] ?? "GENERAL" },
      { period: `Semana ${durationWeeks}`, action: "Encerramento e balanço", channel: channels[0] ?? "GENERAL" },
    ],
    recommendedMetrics: ["Alcance", "Engajamento (curtidas/comentários/compartilhamentos)", "Cliques no CTA", "Leads gerados"],
    risks: ["Conteúdo gerado em modo simulado (sem chave de IA configurada ou após falha da chamada real)."],
    writerInstructions: [
      "Orçamento de mídia paga depende de decisão humana e não foi definido aqui.",
      "Validar cronograma final com a equipe responsável antes de publicar.",
    ],
  };
}

/** Simulated correction: reacts to the Reviewer's feedback instead of echoing the campaign back. */
export function generateSimulatedCampaignRevision(input: RevisionInput<CampaignWriterOutput>): CampaignWriterOutput {
  const { review, originalContent, revisionAttempt } = input;
  const note = `Correção simulada (tentativa ${revisionAttempt})${review.problems.length ? `: ${review.problems.join("; ")}` : ""}.`;

  return {
    ...originalContent,
    mainMessage: review.suggestions.length
      ? `${originalContent.mainMessage} ${review.suggestions[0]}`
      : originalContent.mainMessage,
    risks: [...originalContent.risks, note],
    writerInstructions: [...originalContent.writerInstructions, ...review.correctionInstructions],
  };
}
