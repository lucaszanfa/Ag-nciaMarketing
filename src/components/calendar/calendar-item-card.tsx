"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markContentAsPublished } from "@/server/actions/content.actions";
import { formatTime } from "@/lib/format";
import { platformLabel } from "@/lib/content-labels";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/types/enums";

export interface CalendarContentItem {
  id: string;
  title: string;
  platform: string;
  format: string;
  status: string;
  scheduledAt: string | Date | null;
  project: { id: string; title: string };
}

const STATUS_DOT: Partial<Record<ContentStatus, string>> = {
  SCHEDULED: "bg-violet-500",
  PUBLISHED: "bg-emerald-500",
};

export function CalendarItemCard({
  item,
  compact = false,
  readOnly = false,
}: {
  item: CalendarContentItem;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMarkPublished(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await markContentAsPublished(item.id);
        toast.success("Conteúdo marcado como publicado.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível marcar como publicado.");
      }
    });
  }

  return (
    <Link
      href={`/projetos/${item.project.id}/conteudo/${item.id}`}
      draggable={!readOnly}
      onDragStart={
        readOnly
          ? undefined
          : (e) => {
              e.dataTransfer.setData("text/plain", item.id);
              e.dataTransfer.effectAllowed = "move";
            }
      }
      className={cn(
        "flex flex-col gap-0.5 rounded-md border border-border bg-background px-1.5 py-1 text-left text-xs shadow-xs transition-colors hover:border-primary/40",
        !readOnly && "cursor-grab active:cursor-grabbing"
      )}
      title={`${item.title} — ${item.project.title}`}
    >
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className={cnDot(item.status)} />
        <span>{formatTime(item.scheduledAt)}</span>
        <Badge variant="outline" className="ml-auto px-1 py-0 text-[9px]">
          {platformLabel(item.platform)}
        </Badge>
      </div>
      {!compact && <p className="truncate font-medium text-foreground">{item.title}</p>}
      {!readOnly && item.status === "SCHEDULED" && (
        <button
          type="button"
          onClick={handleMarkPublished}
          disabled={isPending}
          className="mt-0.5 flex items-center gap-1 self-start text-[10px] text-muted-foreground hover:text-emerald-600 disabled:opacity-50"
        >
          <CheckCircle2 className="size-3" />
          Marcar publicado
        </button>
      )}
    </Link>
  );
}

function cnDot(status: string) {
  return `size-1.5 shrink-0 rounded-full ${STATUS_DOT[status as ContentStatus] ?? "bg-muted-foreground"}`;
}
