import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ReviewDecision } from "@/types/enums";

export interface CreateReviewInput {
  projectId: string;
  generatedContentId?: string | null;
  platform?: string | null;
  format?: string | null;
  overallScore: number;
  clarityScore: number;
  channelFitScore: number;
  brandToneScore: number;
  ctaScore: number;
  grammarScore?: number | null;
  briefingAlignmentScore?: number | null;
  factualSafetyScore?: number | null;
  problems: Prisma.InputJsonValue;
  suggestions: Prisma.InputJsonValue;
  correctionInstructions?: Prisma.InputJsonValue;
  suggestedRevision?: string | null;
  decision: ReviewDecision;
  reviewedVersion?: number;
  revisionAttempt?: number;
  triggeredAutomaticRevision?: boolean;
  isFinalAutomaticReview?: boolean;
  requiresHumanDecision?: boolean;
  canBeAutomaticallyRevised?: boolean;
}

export const reviewRepository = {
  create(data: CreateReviewInput) {
    return prisma.review.create({ data });
  },

  createMany(items: CreateReviewInput[]) {
    return prisma.$transaction(items.map((item) => prisma.review.create({ data: item })));
  },

  listByContentId(generatedContentId: string) {
    return prisma.review.findMany({
      where: { generatedContentId },
      orderBy: { revisionAttempt: "asc" },
    });
  },
};
