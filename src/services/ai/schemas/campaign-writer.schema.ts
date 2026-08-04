import { z } from "zod";

export const campaignWriterOutputSchema = z.object({
  /** false when the editorial plan doesn't call for an institutional campaign — a valid, non-error result. */
  required: z.boolean().default(true),
  name: z.string(),
  concept: z.string(),
  objective: z.string(),
  slogan: z.string().nullable().default(null),
  mainMessage: z.string(),
  targetAudience: z.string(),
  durationWeeks: z.number().int().positive(),
  phases: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      durationWeeks: z.number().int().positive(),
      actions: z.array(z.string()).default([]),
    })
  ),
  channels: z.array(z.string()),
  cta: z.string(),
  pieceIdeas: z.array(z.string()),
  schedule: z
    .array(
      z.object({
        period: z.string(),
        action: z.string(),
        channel: z.string(),
      })
    )
    .default([]),
  recommendedMetrics: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  writerInstructions: z.array(z.string()).default([]),
});

export type CampaignWriterOutput = z.infer<typeof campaignWriterOutputSchema>;
