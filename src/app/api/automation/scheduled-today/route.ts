import { NextResponse } from "next/server";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { buildContentCopyText, buildContentPreview } from "@/lib/content-text";
import { startOfDay, endOfDay, toDateInputValue } from "@/lib/calendar-dates";
import { contentUrl } from "@/services/notifications/n8n-webhook";
import type { ContentFormat, Platform } from "@/types/enums";

/**
 * Read-only endpoint for automations (e.g. an n8n daily Schedule Trigger) to
 * ask "what's scheduled to publish today?" — pairs with the editorial
 * calendar (a human already picked each item's date/time in /calendario).
 * This never sends anything itself; it just hands the list to whatever
 * automation wants to act on it (e.g. e-mailing employees).
 */
export async function GET() {
  const now = new Date();
  const items = await generatedContentRepository.listForCalendar({
    status: "SCHEDULED",
    from: startOfDay(now),
    to: endOfDay(now),
  });

  const payload = items.map((item) => ({
    contentId: item.id,
    projectId: item.projectId,
    projectTitle: item.project.title,
    title: item.title,
    platform: item.platform,
    format: item.format,
    scheduledAt: item.scheduledAt,
    preview: buildContentPreview(item.platform as Platform, item.format as ContentFormat, item.content),
    copyText: buildContentCopyText(item.format as ContentFormat, item.content),
    link: contentUrl(item.projectId, item.id),
  }));

  return NextResponse.json({ date: toDateInputValue(now), count: payload.length, items: payload });
}
