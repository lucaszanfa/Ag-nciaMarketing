"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { scheduleContent } from "@/server/actions/content.actions";
import { toDateInputValue, toTimeInputValue, combineDateAndTime } from "@/lib/calendar-dates";

/** Shared "choose a publish date/time" form — used both from a content's own actions and from the calendar's unscheduled list. */
export function ScheduleDialog({
  contentId,
  triggerLabel = "Agendar",
  defaultDate,
  onScheduled,
}: {
  contentId: string;
  triggerLabel?: string;
  defaultDate?: Date | string | null;
  onScheduled?: () => void;
}) {
  const router = useRouter();
  const seed = defaultDate ? new Date(defaultDate) : new Date();
  const [open, setOpen] = useState(false);
  const [dateValue, setDateValue] = useState(() => toDateInputValue(seed));
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(seed));
  const [isPending, startTransition] = useTransition();

  function handleSchedule() {
    if (!dateValue || !timeValue) {
      toast.error("Escolha data e horário.");
      return;
    }
    const scheduledAt = combineDateAndTime(dateValue, timeValue);
    startTransition(async () => {
      try {
        await scheduleContent(contentId, scheduledAt.toISOString());
        toast.success("Conteúdo agendado.");
        setOpen(false);
        onScheduled?.();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível agendar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <CalendarClock className="size-3.5" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agendar publicação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-date-${contentId}`}>Data</Label>
            <Input
              id={`schedule-date-${contentId}`}
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-time-${contentId}`}>Horário</Label>
            <Input
              id={`schedule-time-${contentId}`}
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSchedule} disabled={isPending}>
            Confirmar agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
