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
