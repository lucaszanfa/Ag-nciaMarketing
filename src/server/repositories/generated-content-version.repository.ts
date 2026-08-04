import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AgentType, ContentVersionSource } from "@/types/enums";

export interface CreateVersionInput {
  generatedContentId: string;
  versionNumber: number;
  contentData: Prisma.InputJsonValue;
  textContent?: string | null;
  source: ContentVersionSource;
  createdByAgent?: AgentType | null;
  revisionAttempt?: number;
  reviewId?: string | null;
  changeReason?: string | null;
  usedFallback?: boolean;
}

export const generatedContentVersionRepository = {
  create(data: CreateVersionInput) {
    return prisma.generatedContentVersion.create({ data });
  },

  listByContentId(generatedContentId: string) {
    return prisma.generatedContentVersion.findMany({
      where: { generatedContentId },
      orderBy: { versionNumber: "asc" },
    });
  },

  /**
   * Content created before this phase has no version rows at all — this
   * lazily backfills version 1 from the content's current data the first
   * time version history actually matters (opening it, editing it, or
   * entering the automatic correction loop), so no data migration is needed.
   */
  async ensureInitialVersion(contentId: string): Promise<void> {
    const existing = await prisma.generatedContentVersion.findFirst({
      where: { generatedContentId: contentId },
      select: { id: true },
    });
    if (existing) return;

    const content = await prisma.generatedContent.findUniqueOrThrow({
      where: { id: contentId },
      include: { agentExecution: { select: { agentType: true } } },
    });

    await prisma.generatedContentVersion.create({
      data: {
        generatedContentId: contentId,
        versionNumber: 1,
        contentData: content.content as Prisma.InputJsonValue,
        source: "INITIAL_GENERATION",
        createdByAgent: content.agentExecution.agentType,
        revisionAttempt: 0,
      },
    });
  },
};
