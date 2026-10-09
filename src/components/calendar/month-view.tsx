"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarItemCard, type CalendarContentItem } from "./calendar-item-card";
import { scheduleContent } from "@/server/actions/content.actions";
import { toDateInputValue, withNewDateKeepingTime, type CalendarDay } from "@/lib/calendar-dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function findItem(itemsByDay: Map<string, CalendarContentItem[]>, id: string): CalendarContentItem | null {
  for (const items of itemsByDay.values()) {
    const found = items.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

export function MonthView({
  days,
  itemsByDay,
  readOnly = false,
}: {
  days: CalendarDay[];
  itemsByDay: Map<string, CalendarContentItem[]>;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  async function handleDrop(e: React.DragEvent, day: Date) {
    if (readOnly) return;
    e.preventDefault();
    setDragOverKey(null);
    const contentId = e.dataTransfer.getData("text/plain");
    if (!contentId) return;

    const original = findItem(itemsByDay, contentId);
    if (!original?.scheduledAt) return;

    const newDate = withNewDateKeepingTime(new Date(original.scheduledAt), day);
    try {
      await scheduleContent(contentId, newDate.toISOString());
      toast.success("Conteúdo reagendado.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reagendar.");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateInputValue(day.date);
          const items = itemsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(key);
              }}
              onDragLeave={() => setDragOverKey((prev) => (prev === key ? null : prev))}
              onDrop={(e) => handleDrop(e, day.date)}
              className={cn(
                "flex min-h-28 flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
                !day.isCurrentMonth && "bg-muted/30",
                dragOverKey === key && "bg-primary/5 ring-1 ring-inset ring-primary/30"
              )}
            >
              <span
                className={cn(
                  "self-start rounded px-1 text-xs",
                  day.isToday ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground",
                  !day.isCurrentMonth && "opacity-50"
                )}
              >
                {day.date.getDate()}
              </span>
              <div className="flex flex-col gap-1 overflow-y-auto">
                {items.map((item) => (
                  <CalendarItemCard key={item.id} item={item} compact readOnly={readOnly} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
