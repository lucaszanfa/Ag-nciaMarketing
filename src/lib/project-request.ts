import { z } from "zod";

/**
 * Structured options a project request can carry on top of its free-text description — picked
 * in the home form, or filled in by automations (e.g. a news item chosen by the curator). They
 * are both written into the request text the Chief Editor reads AND enforced after it answers
 * (see `normalizeContentPlan`), because small local models don't always follow instructions.
 */

export const REQUEST_CHANNELS = ["LINKEDIN", "INSTAGRAM", "CAMPAIGN"] as const;
export const REQUEST_OBJECTIVES = ["AUTORIDADE", "LEADS", "RECRUTAMENTO", "INSTITUCIONAL", "LANCAMENTO", "EDUCATIVO"] as const;
export const REQUEST_PERIODS = ["HOJE", "ESTA_SEMANA", "PROXIMA_SEMANA", "ESTE_MES", "PROXIMO_MES"] as const;

export type RequestChannel = (typeof REQUEST_CHANNELS)[number];
export type RequestObjective = (typeof REQUEST_OBJECTIVES)[number];
export type RequestPeriod = (typeof REQUEST_PERIODS)[number];

export const CHANNEL_LABELS: Record<RequestChannel, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  CAMPAIGN: "Campanha estratégica",
};

export const OBJECTIVE_LABELS: Record<RequestObjective, string> = {
  AUTORIDADE: "Autoridade técnica",
  LEADS: "Geração de leads",
  RECRUTAMENTO: "Recrutamento e employer branding",
  INSTITUCIONAL: "Institucional / data comemorativa",
  LANCAMENTO: "Lançamento ou novidade",
  EDUCATIVO: "Conteúdo educativo",
};

export const PERIOD_LABELS: Record<RequestPeriod, string> = {
  HOJE: "Hoje",
  ESTA_SEMANA: "Esta semana",
  PROXIMA_SEMANA: "Próxima semana",
  ESTE_MES: "Este mês",
  PROXIMO_MES: "Próximo mês",
};

export const newsHookSchema = z.object({
  headline: z.string().trim().min(1),
  source: z.string().trim().optional(),
  link: z.string().trim().optional(),
  publishedAt: z.string().trim().optional(),
  /** Why this news matters for the company and which angle the post should take (from the curator). */
  angle: z.string().trim().optional(),
  topic: z.string().trim().optional(),
});

export const requestOptionsSchema = z.object({
  channels: z.array(z.enum(REQUEST_CHANNELS)).default([]),
  quantity: z.number().int().min(1).max(10).nullable().default(null),
  objective: z.enum(REQUEST_OBJECTIVES).nullable().default(null),
  period: z.enum(REQUEST_PERIODS).nullable().default(null),
  newsHook: newsHookSchema.nullable().default(null),
});

export type NewsHook = z.infer<typeof newsHookSchema>;
export type RequestOptions = z.infer<typeof requestOptionsSchema>;

/** Reads `Project.requestOptions` (Json) defensively — older projects have none. */
export function parseRequestOptions(value: unknown): RequestOptions | null {
  const parsed = requestOptionsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ---------- Dates (always in São Paulo time) ----------

const TIME_ZONE = "America/Sao_Paulo";

export function todayIso(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatBr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Inclusive [from, to] range of a period, as YYYY-MM-DD. */
export function periodRange(period: RequestPeriod, today = todayIso()): { from: string; to: string } {
  const date = new Date(`${today}T12:00:00Z`);
  const weekday = date.getUTCDay(); // 0 = Sunday
  const daysToSunday = (7 - weekday) % 7;

  switch (period) {
    case "HOJE":
      return { from: today, to: today };
    case "ESTA_SEMANA":
      return { from: today, to: addDaysIso(today, daysToSunday) };
    case "PROXIMA_SEMANA": {
      const nextMonday = addDaysIso(today, daysToSunday + 1);
      return { from: nextMonday, to: addDaysIso(nextMonday, 6) };
    }
    case "ESTE_MES": {
      const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
      return { from: today, to: end.toISOString().slice(0, 10) };
    }
    case "PROXIMO_MES": {
      const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
      const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0));
      return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
    }
  }
}

// ---------- Request text the Chief Editor reads ----------

export function composeRequestText(description: string, options: RequestOptions | null): string {
  if (!options) return description;

  const params: string[] = [];

  if (options.channels.length > 0) {
    params.push(`- Canais: SOMENTE ${options.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}.`);
    if (!options.channels.includes("CAMPAIGN")) params.push("- Não criar plano de campanha estratégica.");
  }
  if (options.quantity) {
    params.push(`- Quantidade: exatamente ${options.quantity} conteúdo(s) (sem contar plano de campanha).`);
  }
  if (options.objective) params.push(`- Objetivo principal: ${OBJECTIVE_LABELS[options.objective]}.`);
  if (options.period) {
    const { from, to } = periodRange(options.period);
    params.push(
      `- Período de publicação: ${PERIOD_LABELS[options.period].toLowerCase()} (de ${formatBr(from)} a ${formatBr(to)}).`
    );
  }

  const sections = [description.trim()];
  if (params.length > 0) sections.push(`Parâmetros do pedido:\n${params.join("\n")}`);

  if (options.newsHook) {
    const n = options.newsHook;
    const lines = [
      "Notícia usada como gancho (a IA só conhece a manchete, não o texto completo):",
      `- Manchete: ${n.headline}`,
      n.source ? `- Veículo: ${n.source}` : null,
      n.publishedAt ? `- Publicada em: ${n.publishedAt}` : null,
      n.angle ? `- Ângulo sugerido para a empresa: ${n.angle}` : null,
      "Não invente números, nomes ou fatos além da manchete. Cite o veículo como fonte.",
    ].filter((line) => line !== null);
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}
