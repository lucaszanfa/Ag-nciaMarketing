import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ProjectStatus } from "@/types/enums";

export interface ListProjectsFilters {
  search?: string;
  status?: ProjectStatus;
}

const projectListInclude = {
  _count: { select: { generatedContents: true } },
} satisfies Prisma.ProjectInclude;

export const projectDetailInclude = {
  createdBy: true,
  workflowExecution: true,
  agentExecutions: { orderBy: { startedAt: "asc" } },
  generatedContents: {
    include: {
      reviews: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { versionNumber: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  },
  messages: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.ProjectInclude;

export const projectRepository = {
  create(data: { title: string; originalRequest: string; createdById: string }) {
    return prisma.project.create({ data });
  },

  list(filters: ListProjectsFilters = {}) {
    return prisma.project.findMany({
      where: {
        status: filters.status,
        // SQLite's `contains` filter has no `mode` option (Postgres/MySQL-only in
        // Prisma); SQLite's LIKE is already case-insensitive for ASCII text.
        OR: filters.search
          ? [
              { title: { contains: filters.search } },
              { originalRequest: { contains: filters.search } },
            ]
          : undefined,
      },
      include: projectListInclude,
      orderBy: { updatedAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: projectDetailInclude,
    });
  },

  updateStatus(id: string, data: Partial<{ status: ProjectStatus; progress: number; completedAt: Date | null }>) {
    return prisma.project.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },

  async duplicate(id: string) {
    const original = await prisma.project.findUniqueOrThrow({ where: { id } });
    return prisma.project.create({
      data: {
        title: `${original.title} (cópia)`,
        originalRequest: original.originalRequest,
        createdById: original.createdById,
      },
    });
  },
};
