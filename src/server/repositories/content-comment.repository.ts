import { prisma } from "@/lib/prisma";

export interface CreateCommentInput {
  generatedContentId: string;
  authorName: string;
  content: string;
}

export const contentCommentRepository = {
  create(data: CreateCommentInput) {
    return prisma.contentComment.create({ data });
  },

  listByContentId(generatedContentId: string) {
    return prisma.contentComment.findMany({
      where: { generatedContentId },
      orderBy: { createdAt: "asc" },
    });
  },
};
