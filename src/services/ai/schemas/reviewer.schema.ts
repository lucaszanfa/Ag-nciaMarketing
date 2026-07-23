import { z } from "zod";

export const reviewDecisionSchema = z.enum(["APPROVED", "NEEDS_ADJUSTMENT", "REJECTED"]);

export const contentReviewSchema = z.object({
  generatedContentId: z.string(),
  platform: z.string().default(""),
  format: z.string().default(""),
  overallScore: z.number().int().min(0).max(100),
  clarityScore: z.number().int().min(0).max(100),
  channelFitScore: z.number().int().min(0).max(100),
  brandToneScore: z.number().int().min(0).max(100),
  ctaScore: z.number().int().min(0).max(100),
  /** Extra criteria beyond the four persisted as scalar columns (see Review model). */
  grammarScore: z.number().int().min(0).max(100),
  briefingAlignmentScore: z.number().int().min(0).max(100),
  factualSafetyScore: z.number().int().min(0).max(100),
  problems: z.array(z.string()),
  suggestions: z.array(z.string()),
  correctionInstructions: z.array(z.string()).default([]),
  suggestedRevision: z.string().nullable().default(null),
  decision: reviewDecisionSchema,
  /** True when the problem(s) found require a human call instead of an automatic correction round. */
  requiresHumanDecision: z.boolean().default(false),
  /** True when correctionInstructions are concrete/sufficient for a writer agent to act on automatically. */
  canBeAutomaticallyRevised: z.boolean().default(true),
});

export const reviewerOutputSchema = z.object({
  reviews: z.array(contentReviewSchema),
  overallProjectScore: z.number().int().min(0).max(100),
  summary: z.string(),
});

export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;
export type ContentReview = z.infer<typeof contentReviewSchema>;
export type ReviewerOutput = z.infer<typeof reviewerOutputSchema>;
