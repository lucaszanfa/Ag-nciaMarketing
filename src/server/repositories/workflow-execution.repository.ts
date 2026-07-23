import { prisma } from "@/lib/prisma";
import type { AgentType, ProjectStatus } from "@/types/enums";

export const workflowExecutionRepository = {
  createForProject(projectId: string) {
    return prisma.workflowExecution.create({
      data: { projectId, status: "DRAFT" },
    });
  },

  findByProjectId(projectId: string) {
    return prisma.workflowExecution.findUnique({ where: { projectId } });
  },

  update(
    projectId: string,
    data: Partial<{
      status: ProjectStatus;
      currentAgent: AgentType | null;
      progress: number;
      startedAt: Date;
      completedAt: Date | null;
      errorMessage: string | null;
    }>
  ) {
    return prisma.workflowExecution.update({ where: { projectId }, data });
  },
};
