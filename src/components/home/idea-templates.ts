import type { RequestChannel, RequestObjective, RequestPeriod } from "@/lib/project-request";

export interface IdeaTemplate {
  id: string;
  label: string;
  /** Request text; "[...]" marks a placeholder the user should fill in. */
  text: string;
  channels: RequestChannel[];
  quantity: number | null;
  objective: RequestObjective | null;
  period: RequestPeriod | null;
}

const FIXED_TEMPLATES: IdeaTemplate[] = [
  {
    id: "calendario",
    label: "Calendário da próxima semana",
    text: "Calendário de posts para a próxima semana, alternando um tema técnico, um bastidor de obra e um conteúdo institucional.",
    channels: ["LINKEDIN"],
    quantity: 3,
    objective: null,
    period: "PROXIMA_SEMANA",
  },
  {
    id: "case",
    label: "Case de obra concluída",
    text: "Post contando o case da obra [nome da obra / cliente, se autorizado]: qual era o desafio técnico, o que a equipe fez e qual foi o resultado. Detalhes: [escopo, prazo, equipamentos, números que podem ser divulgados].",
    channels: ["LINKEDIN"],
    quantity: 1,
    objective: "AUTORIDADE",
    period: null,
  },
  {
    id: "vaga",
    label: "Divulgar vaga",
    text: "Divulgar a vaga de [cargo] para [cidade / obra]. Requisitos: [formação, experiência, NR10]. Como se candidatar: [link ou e-mail].",
    channels: ["LINKEDIN"],
    quantity: 1,
    objective: "RECRUTAMENTO",
    period: "ESTA_SEMANA",
  },
  {
    id: "data",
    label: "Data comemorativa",
    text: "Mensagem institucional para [data comemorativa], ligando a data à cultura de segurança e à equipe de campo.",
    channels: ["LINKEDIN", "INSTAGRAM"],
    quantity: 2,
    objective: "INSTITUCIONAL",
    period: null,
  },
  {
    id: "campanha",
    label: "Campanha estratégica",
    text: "Campanha de [4] semanas para [objetivo, ex.: gerar leads para estudos elétricos] voltada a [público, ex.: gerentes de manutenção da mineração].",
    channels: ["CAMPAIGN", "LINKEDIN"],
    quantity: 4,
    objective: "LEADS",
    period: "PROXIMO_MES",
  },
];

/** The company's own topics become one-click technical post ideas, followed by generic templates. */
export function buildIdeaTemplates(allowedTopics: string[]): IdeaTemplate[] {
  const topicTemplates = allowedTopics
    .map((topic) => topic.replace(/[.;]+$/, "").trim())
    .filter((topic) => topic.length > 2 && topic.length <= 50)
    .slice(0, 4)
    .map<IdeaTemplate>((topic, i) => ({
      id: `topic-${i}`,
      label: `Post técnico: ${topic}`,
      text: `Post técnico sobre ${topic}, mostrando um problema real que o público enfrenta e como a nossa engenharia resolve. Ponto específico a explorar: [opcional — ex.: um erro comum, uma etapa crítica].`,
      channels: ["LINKEDIN"],
      quantity: 1,
      objective: "AUTORIDADE",
      period: null,
    }));

  return [...topicTemplates, ...FIXED_TEMPLATES];
}
