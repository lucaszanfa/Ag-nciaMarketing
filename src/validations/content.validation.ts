import { z } from "zod";

export const updateContentSchema = z.object({
  content: z.unknown(),
});

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

export const scheduleContentSchema = z.object({
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
});

export type ScheduleContentInput = z.infer<typeof scheduleContentSchema>;

export const uploadContentImageSchema = z.object({
  imageBase64: z.string().min(1, "Campo 'imageBase64' é obrigatório."),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]).default("image/png"),
});

export type UploadContentImageInput = z.infer<typeof uploadContentImageSchema>;

export const listContentQuerySchema = z.object({
  projectId: z.string().optional(),
  platform: z.enum(["LINKEDIN", "INSTAGRAM", "FACEBOOK", "BLOG", "EMAIL", "GENERAL"]).optional(),
  format: z.enum(["POST", "CAROUSEL", "REELS", "STORIES", "ARTICLE", "CAMPAIGN_PLAN"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "REVIEWED",
      "UNDER_AI_REVIEW",
      "AI_REVISING",
      "WAITING_HUMAN_APPROVAL",
      "APPROVED",
      "NEEDS_ADJUSTMENT",
      "REJECTED",
      "SCHEDULED",
      "PUBLISHED",
      "ARCHIVED",
    ])
    .optional(),
  agentType: z
    .enum(["CEO", "CHIEF_EDITOR", "LINKEDIN_WRITER", "INSTAGRAM_WRITER", "CAMPAIGN_WRITER", "REVIEWER"])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ListContentQuery = z.infer<typeof listContentQuerySchema>;
