"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentStatusBadge } from "./status-badge";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentMeta } from "@/lib/agent-meta";
import type { AgentExecutionDetail } from "@/types/project";
import type { AgentStatus } from "@/types/enums";

const NEEDS_ATTENTION: Partial<Record<AgentStatus, true>> = {
  WORKING: true,
  FAILED: true,
  NEEDS_ADJUSTMENT: true,
};

export function AgentCard({
  meta,
  execution,
  summary,
}: {
  meta: AgentMeta;
  execution: AgentExecutionDetail | null;
  summary?: React.ReactNode;
}) {
  const status = (execution?.status ?? "WAITING") as AgentStatus;
  const Icon = meta.icon;
  const isActive = status === "WORKING";
  const isDone = status === "COMPLETED" || status === "COMPLETED_WITH_FALLBACK" || status === "SKIPPED";
  const needsAttention = Boolean(NEEDS_ATTENTION[status]);

  const [open, setOpen] = useState(needsAttention);
  const previousStatus = useRef(status);
  useEffect(() => {
    // Auto-expand the moment an agent starts working or hits a problem, without fighting a
    // manual collapse/expand the person already did on any other (unrelated) card.
    if (status !== previousStatus.current && NEEDS_ATTENTION[status]) setOpen(true);
    previousStatus.current = status;
  }, [status]);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-shadow",
        isActive && "border-primary/50 shadow-md",
        status === "FAILED" && "border-destructive/50"
      )}
    >
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary
          className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted",
              isActive && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none">{meta.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{meta.role}</p>
          </div>
          <AgentStatusBadge status={status} />
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </summary>

        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          {status !== "WAITING" && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Início: {formatTime(execution?.startedAt)}</span>
              <span>Conclusão: {formatTime(execution?.completedAt)}</span>
            </div>
          )}

          {status === "WORKING" && (
            <div className="space-y-1.5">
              <Progress value={execution?.progress ?? 0} className="h-1.5" />
              {execution?.currentMessage && (
                <p className="text-xs text-muted-foreground">{execution.currentMessage}</p>
              )}
            </div>
          )}

          {isDone && execution?.currentMessage && (
            <p className="text-xs text-muted-foreground">{execution.currentMessage}</p>
          )}

          {status === "FAILED" && execution?.errorMessage && (
            <p className="text-xs text-destructive">{execution.errorMessage}</p>
          )}

          {status === "WAITING" && <p className="text-xs text-muted-foreground">Aguardando início.</p>}

          {summary && isDone && <div className="border-t border-border pt-3">{summary}</div>}
        </div>
      </details>
    </Card>
  );
}
