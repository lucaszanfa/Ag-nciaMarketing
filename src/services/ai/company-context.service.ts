import { settingsRepository } from "@/server/repositories/settings.repository";
import type { CompanyContext } from "./types";

/** Builds the single object every agent receives describing the company. */
export async function buildCompanyContext(): Promise<CompanyContext> {
  const settings = await settingsRepository.get();

  const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

  return {
    companyName: settings.companyName,
    description: settings.description,
    industry: settings.industry,
    targetAudience: settings.targetAudience,
    toneOfVoice: settings.toneOfVoice,
    products: asStringArray(settings.products),
    services: asStringArray(settings.services),
    objectives: asStringArray(settings.objectives),
    preferredTerms: asStringArray(settings.preferredTerms),
    forbiddenTerms: asStringArray(settings.forbiddenTerms),
    allowedTopics: asStringArray(settings.allowedTopics),
    forbiddenTopics: asStringArray(settings.forbiddenTopics),
    defaultCta: settings.defaultCta,
    hashtags: asStringArray(settings.hashtags),
    website: settings.website,
    socialNetworks:
      settings.socialNetworks && typeof settings.socialNetworks === "object" && !Array.isArray(settings.socialNetworks)
        ? (settings.socialNetworks as Record<string, string>)
        : {},
    today: formatToday(),
  };
}

function formatToday(now = new Date()): string {
  const timeZone = "America/Sao_Paulo";
  const weekday = now.toLocaleDateString("pt-BR", { timeZone, weekday: "long" });
  const ptBr = now.toLocaleDateString("pt-BR", { timeZone });
  const iso = now.toLocaleDateString("en-CA", { timeZone }); // YYYY-MM-DD
  return `${weekday}, ${ptBr} (${iso})`;
}
