import { z } from "zod";

// ---------- Real AI output (Chief Editor only, Phase 2) ----------

const contentPlanPlatformSchema = z.enum(["LINKEDIN", "INSTAGRAM", "FACEBOOK", "BLOG", "EMAIL", "GENERAL"]);
const contentPlanFormatSchema = z.enum(["POST", "CAROUSEL", "REELS", "STORIES", "ARTICLE", "CAMPAIGN_PLAN"]);

export const contentPlanItemSchema = z.object({
  id: z.string(),
  platform: contentPlanPlatformSchema,
  format: contentPlanFormatSchema,
  theme: z.string(),
  objective: z.string(),
  briefing: z.string(),
  suggestedDate: z.string(),
});

export const chiefEditorPlanSchema = z.object({
  projectTitle: z.string(),
  summary: z.string(),
  objective: z.string(),
  targetAudience: z.string(),
  tone: z.string(),
  mainMessage: z.string(),
  primaryCta: z.string(),
  contentPlan: z.array(contentPlanItemSchema).min(1),
});

export type ContentPlanItem = z.infer<typeof contentPlanItemSchema>;
export type ChiefEditorPlan = z.infer<typeof chiefEditorPlanSchema>;
