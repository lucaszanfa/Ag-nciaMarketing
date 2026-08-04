import { randomInt } from "@/lib/random";
import type { ReviewerInput } from "./reviewer.agent";
import type { ContentReview, ReviewDecision, ReviewerOutput } from "../schemas/reviewer.schema";

function containsForbiddenTerm(text: string, forbiddenTerms: string[]): string | null {
  const lower = text.toLowerCase();
  return forbiddenTerms.find((term) => term.trim() && lower.includes(term.trim().toLowerCase())) ?? null;
}

function scoreToDecision(overall: number, hasForbiddenTerm: boolean, factualSafetyScore: number): ReviewDecision {
  if (hasForbiddenTerm || factualSafetyScore < 50) {
    return overall >= 50 ? "NEEDS_ADJUSTMENT" : "REJECTED";
  }
  if (overall >= 85) return "APPROVED";
  if (overall >= 65) return "NEEDS_ADJUSTMENT";
  return "REJECTED";
}

export function generateSimulatedReview(input: ReviewerInput): ReviewerOutput {
  const reviews: ContentReview[] = input.contents.map((content) => {
    const clarityScore = randomInt(80, 97);
    const channelFitScore = randomInt(78, 95);
    const brandToneScore = randomInt(82, 96);
    const ctaScore = randomInt(75, 94);
    const grammarScore = randomInt(85, 98);
    const briefingAlignmentScore = randomInt(78, 95);
    const forbiddenTerm = containsForbiddenTerm(content.contentText, input.company.forbiddenTerms);
    const factualSafetyScore = forbiddenTerm ? randomInt(20, 45) : randomInt(85, 100);

    const overallScore = Math.round(
      (clarityScore + channelFitScore + brandToneScore + ctaScore + grammarScore + briefingAlignmentScore + factualSafetyScore) /
        7
    );
    const decision = scoreToDecision(overallScore, Boolean(forbiddenTerm), factualSafetyScore);
    // Forbidden terms may hide a strategic/legal problem a rewrite can't safely resolve on its
    // own — the simulated reviewer stays conservative and defers those to a human.
    const requiresHumanDecision = Boolean(forbiddenTerm) && factualSafetyScore < 30;
    const canBeAutomaticallyRevised = decision !== "APPROVED" && !requiresHumanDecision;

    const problems: string[] = [];
    const suggestions: string[] = [];
    const correctionInstructions: string[] = [];

    if (forbiddenTerm) {
      problems.push(`Termo proibido encontrado no conteúdo: "${forbiddenTerm}".`);
      correctionInstructions.push(`Remover ou substituir o termo "${forbiddenTerm}" por uma alternativa aprovada.`);
    }
    if (ctaScore < 85) {
      problems.push("O CTA poderia ser mais direto sobre o próximo passo esperado.");
      suggestions.push("Testar uma chamada de ação mais específica (ex.: agendar uma conversa).");
    }
    if (channelFitScore < 85) {
      problems.push(`Formato pode ser ajustado para se adequar melhor ao padrão de consumo de ${content.platform}.`);
      suggestions.push("Encurtar o texto de abertura para reter atenção nos primeiros segundos.");
    }
    if (problems.length === 0) {
      suggestions.push("Conteúdo pronto para publicação; considerar variações de CTA em testes futuros.");
    }

    return {
      generatedContentId: content.id,
      platform: content.platform,
      format: content.format,
      overallScore,
      clarityScore,
      channelFitScore,
      brandToneScore,
      ctaScore,
      grammarScore,
      briefingAlignmentScore,
      factualSafetyScore,
      problems,
      suggestions,
      correctionInstructions,
      suggestedRevision: null,
      decision,
      requiresHumanDecision,
      canBeAutomaticallyRevised,
    };
  });

  const overallProjectScore = reviews.length
    ? Math.round(reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length)
    : 0;

  return {
    reviews,
    overallProjectScore,
    summary:
      overallProjectScore >= 85
        ? "Conteúdos consistentes com o tom da marca e prontos para publicação, com pequenos ajustes opcionais. (Revisão simulada.)"
        : "Conteúdos no caminho certo, mas alguns itens precisam de ajustes antes da publicação. (Revisão simulada.)",
  };
}
