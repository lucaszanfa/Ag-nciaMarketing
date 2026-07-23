import { z } from "zod";

export const linkedInPostFormatSchema = z.enum(["POST", "ARTICLE", "POLL"]);

export const linkedInPostSchema = z.object({
  /** Id of the Chief Editor's content-plan item this post fulfills. */
  briefId: z.string(),
  internalTitle: z.string().min(1),
  objective: z.string().min(1),
  audience: z.string().min(1),
  format: linkedInPostFormatSchema.default("POST"),
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()),
  visualSuggestion: z.string().min(1),
  strategicNotes: z.array(z.string()).default([]),
});

export const linkedInWriterOutputSchema = z.object({
  posts: z.array(linkedInPostSchema).min(1),
});

export type LinkedInPostFormat = z.infer<typeof linkedInPostFormatSchema>;
export type LinkedInPost = z.infer<typeof linkedInPostSchema>;
export type LinkedInWriterOutput = z.infer<typeof linkedInWriterOutputSchema>;
