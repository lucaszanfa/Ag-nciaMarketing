import { z } from "zod";

// ---------- Real AI output (Chief Editor only, Phase 2) ----------

// Only platforms that actually have a writer agent — anything else would be planned and then
// silently never written.
const contentPlanPlatformSchema = z.enum(["LINKEDIN", "INSTAGRAM", "GENERAL"]);
const contentPlanFormatSchema = z.enum(["POST", "CAROUSEL", "REELS", "STORIES", "ARTICLE", "CAMPAIGN_PLAN"]);

export const contentPlanItemSchema = z.object({
  id: z.string(),
  platform: contentPlanPlatformSchema,
  format: contentPlanFormatSchema.describe(
    "LINKEDIN accepts only POST or ARTICLE. INSTAGRAM accepts POST, CAROUSEL, REELS or STORIES. " +
      "GENERAL accepts only CAMPAIGN_PLAN, used ONLY when the request explicitly asks for a " +
      "multi-week strategic campaign."
  ),
  theme: z.string(),
  objective: z.string(),
  briefing: z.string(),
  suggestedDate: z.string().describe("Calendar date in the format YYYY-MM-DD, never in the past."),
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
