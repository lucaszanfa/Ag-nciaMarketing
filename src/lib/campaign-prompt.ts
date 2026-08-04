import type { AutomationCampaignInput } from "@/validations/project.validation";

/** Turns structured campaign-calendar fields into the natural-language request the Chief Editor expects. */
export function buildCampaignRequestText(input: AutomationCampaignInput): string {
  const heading =
    `Criar conteúdo de marketing para a campanha comemorativa "${input.campanha}"` +
    (input.categoria ? ` (categoria: ${input.categoria})` : "") +
    (input.periodo ? `, no período: ${input.periodo}` : "") +
    ".";

  const lines = [heading, "", `Contexto: ${input.informacaoPrincipal}`];

  if (input.mes) lines.push(`Mês: ${input.mes}`);
  if (input.fonteOficial) lines.push(`Fonte oficial: ${input.fonteOficial}`);
  if (input.imagemReferencia) {
    lines.push(`Referência visual sugerida (link, não acessível diretamente pela IA): ${input.imagemReferencia}`);
  }

  return lines.join("\n");
}
