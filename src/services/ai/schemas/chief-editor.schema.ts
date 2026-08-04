import { z } from "zod";

// ---------- Real AI output (Chief Editor only, Phase 2) ----------

const contentPlanPlatformSchema = z.enum(["LINKEDIN", "INSTAGRAM", "FACEBOOK", "BLOG", "EMAIL", "GENERAL"]);
const contentPlanFormatSchema = z.enum(["POST", "CAROUSEL", "REELS", "STORIES", "ARTICLE", "CAMPAIGN_PLAN"]);

export const contentPlanItemSchema = z.object({
  id: z.string(),
  platform: contentPlanPlatformSchema,
  format: contentPlanFormatSchema.describe(
    "POST/CAROUSEL/REELS/STORIES/ARTICLE are individual pieces of content about a topic. " +
      "CAMPAIGN_PLAN is different: use it ONLY when the CEO explicitly asks for a full " +
      "institutional campaign (a multi-week strategic initiative with phases, a schedule, and " +
      "multiple channels) — not for a single post that merely mentions or announces something. " +
      "If the request says 'campanha'/'campaign' as a strategic initiative, the content plan " +
      "MUST include exactly one item with format CAMPAIGN_PLAN and platform GENERAL."
  ),
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
