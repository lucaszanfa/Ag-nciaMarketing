import { Suspense } from "react";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { UnscheduledSidebar } from "@/components/calendar/unscheduled-sidebar";
import type { CalendarContentItem } from "@/components/calendar/calendar-item-card";
import {
  getMonthGrid,
  getWeekDays,
  parseAnchorDate,
  toDateInputValue,
  startOfDay,
  endOfDay,
  formatMonthLabel,
  formatWeekLabel,
} from "@/lib/calendar-dates";
import type { ContentStatus, Platform } from "@/types/enums";

export default async function CalendarPage(props: PageProps<"/calendario">) {
  const rawSearchParams = await props.searchParams;
  const single = (key: string) => {
    const value = rawSearchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const view = single("view") === "week" ? "week" : "month";
  const anchor = parseAnchorDate(single("date"));
  const platform = single("platform") as Platform | undefined;
  const projectId = single("projectId");
  const status = single("status") as ContentStatus | undefined;

  const days = view === "month" ? getMonthGrid(anchor).map((d) => d.date) : getWeekDays(anchor);
  const from = startOfDay(days[0]);
  const to = endOfDay(days[days.length - 1]);

  const [scheduled, unscheduled, projects] = await Promise.all([
    generatedContentRepository.listForCalendar({ platform, projectId, status, from, to }),
    generatedContentRepository.listApprovedUnscheduled({ platform, projectId }),
    projectRepository.list(),
  ]);

  const itemsByDay = new Map<string, CalendarContentItem[]>();
  for (const item of scheduled) {
    if (!item.scheduledAt) continue;
    const key = toDateInputValue(item.scheduledAt);
    const list = itemsByDay.get(key) ?? [];
    list.push({
      id: item.id,
      title: item.title,
      platform: item.platform,
      format: item.format,
      status: item.status,
      scheduledAt: item.scheduledAt,
      project: item.project,
    });
    itemsByDay.set(key, list);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendário editorial</h1>
          <p className="text-sm capitalize text-muted-foreground">
            {view === "month" ? formatMonthLabel(anchor) : formatWeekLabel(anchor)}
          </p>
        </div>
      </div>

      <Suspense>
        <CalendarToolbar projects={projects.map((p) => ({ id: p.id, title: p.title }))} anchor={anchor} view={view} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {view === "month" ? (
          <MonthView days={getMonthGrid(anchor)} itemsByDay={itemsByDay} />
        ) : (
          <WeekView days={days} itemsByDay={itemsByDay} />
        )}

        <UnscheduledSidebar
          items={unscheduled.map((item) => ({
            id: item.id,
            title: item.title,
            platform: item.platform,
            format: item.format,
            project: item.project,
          }))}
        />
      </div>
    </div>
  );
}
