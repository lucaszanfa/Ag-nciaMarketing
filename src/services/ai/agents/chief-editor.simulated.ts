import { pickMany, pickOne, randomInt } from "@/lib/random";
import type { ChiefEditorInput } from "./chief-editor.agent";
import type { ChiefEditorPlan, ContentPlanItem } from "../schemas/chief-editor.schema";

// Used whenever ANTHROPIC_API_KEY isn't configured, so the whole workflow can
// be exercised end-to-end with simulated data before any real API is wired in.
const TONES = ["Consultivo e confiante", "Próximo e inspirador", "Direto e orientado a resultados", "Educativo e acolhedor"];
const THEME_POOL = [
  "Bastidores da operação",
  "Cases de sucesso de clientes",
  "Tendências do setor",
  "Erros comuns e como evitá-los",
  "Comparativos e decisão de compra",
  "Novidades e lançamentos",
];

function addDays(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generateSimulatedChiefEditorPlan(input: ChiefEditorInput): ChiefEditorPlan {
  const themes = pickMany(THEME_POOL, randomInt(3, 4));
  const tone = input.company.toneOfVoice?.trim() || pickOne(TONES);
  const primaryCta = input.company.defaultCta?.trim() || "Fale com nosso time";
  const targetAudience = input.company.targetAudience?.trim() || "Tomadores de decisão e clientes em potencial da empresa";

  const linkedinCount = randomInt(3, 5);
  const carouselCount = randomInt(1, 2);
  const reelsCount = randomInt(1, 2);

  const now = new Date();
  let dayOffset = 1;
  const contentPlan: ContentPlanItem[] = [];

  for (let i = 0; i < linkedinCount; i++) {
    const theme = themes[i % themes.length];
    contentPlan.push({
      id: `li-${i + 1}`,
      platform: "LINKEDIN",
      format: "POST",
      theme,
      objective: `Reforçar autoridade sobre ${theme.toLowerCase()}`,
      briefing: `Escrever um post de LinkedIn sobre ${theme.toLowerCase()}, tom ${tone.toLowerCase()}, terminando com "${primaryCta}".`,
      suggestedDate: addDays(now, dayOffset),
    });
    dayOffset += 2;
  }

  for (let i = 0; i < carouselCount; i++) {
    const theme = themes[i % themes.length];
    contentPlan.push({
      id: `ig-carousel-${i + 1}`,
      platform: "INSTAGRAM",
      format: "CAROUSEL",
      theme,
      objective: `Educar o público sobre ${theme.toLowerCase()}`,
      briefing: `Montar um carrossel de 4 a 5 slides explicando ${theme.toLowerCase()} de forma simples.`,
      suggestedDate: addDays(now, dayOffset),
    });
    dayOffset += 2;
  }

  for (let i = 0; i < reelsCount; i++) {
    const theme = themes[(i + 1) % themes.length];
    contentPlan.push({
      id: `ig-reels-${i + 1}`,
      platform: "INSTAGRAM",
      format: "REELS",
      theme,
      objective: `Gerar alcance com conteúdo rápido sobre ${theme.toLowerCase()}`,
      briefing: `Roteiro de Reels de 15 segundos sobre ${theme.toLowerCase()}, com gancho nos primeiros 3 segundos.`,
      suggestedDate: addDays(now, dayOffset),
    });
    dayOffset += 2;
  }

  contentPlan.push({
    id: "campaign-1",
    platform: "GENERAL",
    format: "CAMPAIGN_PLAN",
    theme: themes[0],
    objective: `Apoiar institucionalmente a divulgação sobre ${themes[0].toLowerCase()}`,
    briefing: `Estruturar uma campanha institucional de apoio ao tema "${themes[0]}", com fases de teaser, lançamento e sustentação.`,
    suggestedDate: addDays(now, dayOffset),
  });

  return {
    projectTitle: input.originalRequest.slice(0, 80),
    summary: `Plano simulado gerado para responder: "${input.originalRequest.slice(0, 140)}".`,
    objective: `Responder à solicitação "${input.originalRequest.slice(0, 100)}" com um plano de conteúdo multi-canal para ${input.company.companyName}.`,
    targetAudience,
    tone,
    mainMessage: `${input.company.companyName} entrega valor real para ${targetAudience.toLowerCase()}.`,
    primaryCta,
    contentPlan,
  };
}
