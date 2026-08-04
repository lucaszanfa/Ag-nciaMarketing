import { z } from "zod";

export const createProjectSchema = z.object({
  originalRequest: z
    .string()
    .trim()
    .min(10, "Descreva sua solicitação com um pouco mais de detalhe (mínimo 10 caracteres)."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

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
