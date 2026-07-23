import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AgentStatus, AgentType } from "@/types/enums";

export const agentExecutionRepository = {
  create(data: {
    projectId: string;
    workflowExecutionId?: string | null;
    agentType: AgentType;
    status?: AgentStatus;
    input?: Prisma.InputJsonValue;
  }) {
    return prisma.agentExecution.create({ data });
  },

  update(
    id: string,
    data: Partial<{
      status: AgentStatus;
      progress: number;
      currentMessage: string | null;
      output: Prisma.InputJsonValue;
      startedAt: Date;
      completedAt: Date | null;
      errorMessage: string | null;
      provider: string | null;
      model: string | null;
      promptVersion: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
      totalTokens: number | null;
      retryCount: number;
      usedFallback: boolean;
    }>
  ) {
    return prisma.agentExecution.update({ where: { id }, data });
  },

  findByProjectAndType(projectId: string, agentType: AgentType) {
    return prisma.agentExecution.findFirst({ where: { projectId, agentType } });
  },
};
