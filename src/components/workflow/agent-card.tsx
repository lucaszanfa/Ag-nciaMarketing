import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentStatusBadge } from "./status-badge";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentMeta } from "@/lib/agent-meta";
import type { AgentExecutionDetail } from "@/types/project";
import type { AgentStatus } from "@/types/enums";

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

  return (
    <Card className={cn("gap-3 transition-shadow", isActive && "border-primary/50 shadow-md")}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted",
              isActive && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{meta.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{meta.role}</p>
          </div>
        </div>
        <AgentStatusBadge status={status} />
      </CardHeader>

      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
