import { z } from "zod";

export const newsEvaluationSchema = z.object({
  /** Number of the headline in the list the curator received. */
  index: z.number().int().min(1),
  relevance: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("0-10. 9-10: directly about the company's core services/market. 7-8: adjacent, the company can comment with real authority. 0-6: unrelated, consumer, political, crime, local complaints."),
  reason: z.string().describe("One sentence in pt-BR explaining the score."),
  angle: z
    .string()
    .describe("pt-BR, 1-2 sentences: the concrete technical angle the company would use for a post (which service/expertise, which real issue). Empty when relevance < 7."),
});

export const newsCuratorOutputSchema = z.object({
  evaluations: z.array(newsEvaluationSchema),
});

export type NewsEvaluation = z.infer<typeof newsEvaluationSchema>;
export type NewsCuratorOutput = z.infer<typeof newsCuratorOutputSchema>;
