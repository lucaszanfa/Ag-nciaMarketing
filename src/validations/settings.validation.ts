import { z } from "zod";

export const updateSettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Informe o nome da empresa."),
  description: z.string().trim().optional().or(z.literal("")),
  industry: z.string().trim().optional().or(z.literal("")),
  products: z.array(z.string().trim().min(1)).default([]),
  services: z.array(z.string().trim().min(1)).default([]),
  targetAudience: z.string().trim().optional().or(z.literal("")),
  toneOfVoice: z.string().trim().optional().or(z.literal("")),
  objectives: z.array(z.string().trim().min(1)).default([]),
  preferredTerms: z.array(z.string().trim().min(1)).default([]),
  forbiddenTerms: z.array(z.string().trim().min(1)).default([]),
  allowedTopics: z.array(z.string().trim().min(1)).default([]),
  forbiddenTopics: z.array(z.string().trim().min(1)).default([]),
  defaultCta: z.string().trim().optional().or(z.literal("")),
  hashtags: z.array(z.string().trim().min(1)).default([]),
  website: z.string().trim().optional().or(z.literal("")),
  socialNetworks: z.record(z.string(), z.string()).default({}),
  logoUrl: z.string().trim().optional().or(z.literal("")),
  colors: z.array(z.string().trim().min(1)).default([]),
  visualGuidelines: z.string().trim().optional().or(z.literal("")),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
