"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarItemCard, type CalendarContentItem } from "./calendar-item-card";
import { scheduleContent } from "@/server/actions/content.actions";
import { toDateInputValue, withNewDateKeepingTime, formatDayLabel, isSameDay } from "@/lib/calendar-dates";
import { cn } from "@/lib/utils";

function findItem(itemsByDay: Map<string, CalendarContentItem[]>, id: string): CalendarContentItem | null {
  for (const items of itemsByDay.values()) {
    const found = items.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

export function WeekView({
  days,
  itemsByDay,
}: {
  days: Date[];
  itemsByDay: Map<string, CalendarContentItem[]>;
}) {
  const router = useRouter();
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const today = new Date();

  async function handleDrop(e: React.DragEvent, day: Date) {
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
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = toDateInputValue(day);
        const items = itemsByDay.get(key) ?? [];
        return (
          <div
            key={key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverKey(key);
            }}
            onDragLeave={() => setDragOverKey((prev) => (prev === key ? null : prev))}
            onDrop={(e) => handleDrop(e, day)}
            className={cn(
              "flex min-h-80 flex-col gap-1.5 rounded-xl border border-border p-2",
              dragOverKey === key && "bg-primary/5 ring-1 ring-inset ring-primary/30"
            )}
          >
            <p className={cn("text-xs font-medium capitalize", isSameDay(day, today) ? "text-primary" : "text-muted-foreground")}>
              {formatDayLabel(day)}
            </p>
            <div className="flex flex-col gap-1.5 overflow-y-auto">
              {items.map((item) => (
                <CalendarItemCard key={item.id} item={item} />
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground/60">Nada agendado</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
