import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AgentType, MessageAuthorType } from "@/types/enums";

export const messageRepository = {
  create(data: {
    projectId: string;
    authorType: MessageAuthorType;
    agentType?: AgentType | null;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.projectMessage.create({ data: { ...data, metadata: data.metadata ?? {} } });
  },

  listByProject(projectId: string) {
    return prisma.projectMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  },

  listAll(limit = 100) {
    return prisma.projectMessage.findMany({
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
