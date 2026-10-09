import { NextResponse } from "next/server";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { buildContentPreview } from "@/lib/content-text";
import { addDays, endOfDay, startOfWeek, toDateInputValue } from "@/lib/calendar-dates";
import { contentUrl } from "@/services/notifications/n8n-webhook";
import type { ContentFormat, Platform } from "@/types/enums";

/**
 * Read-only endpoint for automations (e.g. an n8n weekly Schedule Trigger) to
 * build a digest: what's scheduled this week, what's stuck waiting on a human
 * decision, and what was scheduled but never got marked published. Never
 * sends anything itself — pairs with `/scheduled-today` for the daily case.
 */
export async function GET() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const [scheduled, pending, overdue] = await Promise.all([
    generatedContentRepository.listForCalendar({ status: "SCHEDULED", from: weekStart, to: weekEnd }),
    generatedContentRepository.listPendingApproval(),
    generatedContentRepository.listOverdueScheduled(now),
  ]);

  const summarize = (items: typeof scheduled) =>
    items.map((item) => ({
      contentId: item.id,
      projectId: item.projectId,
      projectTitle: item.project.title,
      title: item.title,
      platform: item.platform,
      format: item.format,
      scheduledAt: item.scheduledAt,
      preview: buildContentPreview(item.platform as Platform, item.format as ContentFormat, item.content),
      link: contentUrl(item.projectId, item.id),
    }));

  return NextResponse.json({
    weekStart: toDateInputValue(weekStart),
    weekEnd: toDateInputValue(addDays(weekStart, 6)),
    scheduled: { count: scheduled.length, items: summarize(scheduled) },
    pendingApproval: { count: pending.length, items: summarize(pending) },
    overdue: { count: overdue.length, items: summarize(overdue) },
  });
}
