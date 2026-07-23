import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AgentType, ContentFormat, ContentStatus, Platform, ReviewDecision } from "@/types/enums";

export interface ListContentFilters {
  projectId?: string;
  platform?: Platform;
  format?: ContentFormat;
  status?: ContentStatus;
  agentType?: AgentType;
  from?: Date;
  to?: Date;
}

export interface CreateContentInput {
  projectId: string;
  agentExecutionId: string;
  platform: Platform;
  format: ContentFormat;
  title: string;
  content: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  maxAutomaticRevisions?: number;
}

export const generatedContentRepository = {
  create(data: CreateContentInput) {
    return prisma.generatedContent.create({ data: { ...data, metadata: data.metadata ?? {} } });
  },

  createMany(items: CreateContentInput[]) {
    return prisma.$transaction(
      items.map((item) => prisma.generatedContent.create({ data: { ...item, metadata: item.metadata ?? {} } }))
    );
  },

  list(filters: ListContentFilters = {}) {
    return prisma.generatedContent.findMany({
      where: {
        projectId: filters.projectId,
        platform: filters.platform,
        format: filters.format,
        status: filters.status,
        agentExecution: filters.agentType ? { agentType: filters.agentType } : undefined,
        createdAt:
          filters.from || filters.to
            ? { gte: filters.from, lte: filters.to }
            : undefined,
      },
      include: {
        project: { select: { id: true, title: true } },
        agentExecution: { select: { agentType: true } },
        reviews: { orderBy: { createdAt: "asc" } },
        versions: { orderBy: { versionNumber: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.generatedContent.findUnique({
      where: { id },
      include: {
        project: true,
        agentExecution: true,
        reviews: { orderBy: { createdAt: "asc" } },
        versions: { orderBy: { versionNumber: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  /** Count of reviewable content in a project still waiting on a human decision. */
  countWaitingApproval(projectId: string) {
    return prisma.generatedContent.count({ where: { projectId, status: "WAITING_HUMAN_APPROVAL" } });
  },

  /** Bulk human decision on every content item in a project currently awaiting approval. */
  async decideAllWaitingApproval(projectId: string, status: "APPROVED" | "REJECTED"): Promise<number> {
    const result = await prisma.generatedContent.updateMany({
      where: { projectId, status: "WAITING_HUMAN_APPROVAL" },
      data: { status },
    });
    return result.count;
  },

  updateStatus(id: string, status: ContentStatus) {
    return prisma.generatedContent.update({ where: { id }, data: { status } });
  },

  updateContent(id: string, content: Prisma.InputJsonValue) {
    return prisma.generatedContent.update({ where: { id }, data: { content } });
  },

  updateImageUrl(id: string, imageUrl: string) {
    return prisma.generatedContent.update({ where: { id }, data: { imageUrl } });
  },

  /**
   * Atomic compare-and-swap: only flips `status` when it's currently one of
   * `fromStatuses`. Used as the per-content lock for the automatic correction
   * loop — no interactive transaction needed, single SQLite statement.
   * Returns false when the content was already locked or in an unexpected state.
   */
  async tryTransitionStatus(id: string, fromStatuses: ContentStatus[], toStatus: ContentStatus): Promise<boolean> {
    const result = await prisma.generatedContent.updateMany({
      where: { id, status: { in: fromStatuses } },
      data: { status: toStatus },
    });
    return result.count > 0;
  },

  updateRevisionState(
    id: string,
    data: Partial<{
      status: ContentStatus;
      currentVersion: number;
      automaticRevisionCount: number;
      latestReviewDecision: ReviewDecision | null;
      revisionLimitReached: boolean;
      lastReviewId: string | null;
    }>
  ) {
    return prisma.generatedContent.update({ where: { id }, data });
  },

  /** Content scheduled to publish within `[from, to]` — the editorial calendar's main query. */
  listForCalendar(filters: { platform?: Platform; projectId?: string; status?: ContentStatus; from: Date; to: Date }) {
    return prisma.generatedContent.findMany({
      where: {
        platform: filters.platform,
        projectId: filters.projectId,
        status: filters.status ?? { in: ["SCHEDULED", "PUBLISHED"] },
        scheduledAt: { gte: filters.from, lte: filters.to },
      },
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  },

  /** Approved content that hasn't been given a publish date yet — the calendar's "waiting to schedule" list. */
  listApprovedUnscheduled(filters: { platform?: Platform; projectId?: string } = {}) {
    return prisma.generatedContent.findMany({
      where: {
        status: "APPROVED",
        scheduledAt: null,
        platform: filters.platform,
        projectId: filters.projectId,
      },
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Assigns/changes the publish date — only meaningful from APPROVED (first schedule) or SCHEDULED (reschedule). */
  async updateSchedule(id: string, scheduledAt: Date): Promise<boolean> {
    const result = await prisma.generatedContent.updateMany({
      where: { id, status: { in: ["APPROVED", "SCHEDULED"] } },
      data: { scheduledAt, status: "SCHEDULED" },
    });
    return result.count > 0;
  },

  async markPublished(id: string): Promise<boolean> {
    const result = await prisma.generatedContent.updateMany({
      where: { id, status: "SCHEDULED" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return result.count > 0;
  },
};
