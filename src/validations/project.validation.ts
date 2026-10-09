import { z } from "zod";

export const createProjectSchema = z.object({
  originalRequest: z
    .string()
    .trim()
    .min(10, "Descreva sua solicitação com um pouco mais de detalhe (mínimo 10 caracteres)."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Inbound payload for automations that hand over recent news headlines (e.g. an n8n workflow
 * reading Google News RSS) — see `/api/automation/pautas`. The app's curator agent decides which
 * ones are actually relevant for the company before any project is created.
 */
export const automationNewsSchema = z.object({
  candidatos: z
    .array(
      z.object({
        titulo: z.string().trim().min(1),
        fonte: z.string().trim().optional(),
        link: z.string().trim().optional(),
        data: z.string().trim().optional(),
        tema: z.string().trim().optional(),
      })
    )
    .min(1, "Envie ao menos uma notícia em 'candidatos'.")
    .max(80, "Envie no máximo 80 notícias por vez."),
  maxPautas: z.number().int().min(1).max(10).default(3),
  canal: z.enum(["LINKEDIN", "INSTAGRAM"]).default("LINKEDIN"),
});

export type AutomationNewsInput = z.infer<typeof automationNewsSchema>;

export const listProjectsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum(["DRAFT", "RUNNING", "WAITING_APPROVAL", "COMPLETED", "FAILED", "ARCHIVED"])
    .optional(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/**
 * Inbound payload for automations (e.g. an n8n workflow reading a calendar of
 * commemorative-date campaigns) that create a project directly, without a
 * human typing a prompt — see `/api/automation/campaigns`.
 */
export const automationCampaignSchema = z.object({
  campanha: z.string().trim().min(1, "Campo 'campanha' é obrigatório."),
  informacaoPrincipal: z.string().trim().min(1, "Campo 'informacaoPrincipal' é obrigatório."),
  mes: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  periodo: z.string().trim().optional(),
  fonteOficial: z.string().trim().optional(),
  imagemReferencia: z.string().trim().optional(),
});

export type AutomationCampaignInput = z.infer<typeof automationCampaignSchema>;
