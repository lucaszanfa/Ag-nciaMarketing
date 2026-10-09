"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "./status-badge";
import { AgentFlow } from "./agent-flow";
import { MessageHistory } from "./message-history";
import { RequestSummary } from "./request-summary";
import { DeliveryTabs } from "@/components/delivery/delivery-tabs";
import { formatDateTime } from "@/lib/format";
import { retryWorkflow } from "@/server/actions/project.actions";
import type { ProjectDetail, SerializedProjectDetail } from "@/types/project";
import type { ProjectStatus } from "@/types/enums";

const TERMINAL_STATUSES = new Set(["WAITING_APPROVAL", "COMPLETED", "FAILED", "ARCHIVED"]);
const POLL_INTERVAL_MS = 3000;

function normalize(project: ProjectDetail): SerializedProjectDetail {
  return JSON.parse(JSON.stringify(project));
}

export function ProjectWorkspace({
  initialProject,
  company,
}: {
  initialProject: ProjectDetail;
  company: { name: string; logoUrl: string | null };
}) {
  const [project, setProject] = useState<SerializedProjectDetail>(() => normalize(initialProject));
  const [retrying, setRetrying] = useState(false);
  const isTerminal = TERMINAL_STATUSES.has(project.status);

  // Re-sync local state whenever the server gives us a fresh `initialProject` (e.g. after
  // `router.refresh()` from a content action) — polling alone doesn't cover this because it
  // stops once the project reaches a terminal status like WAITING_APPROVAL, which is exactly
  // when the approval actions become available.
  useEffect(() => {
    setProject(normalize(initialProject));
  }, [initialProject]);

  useEffect(() => {
    if (isTerminal) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as SerializedProjectDetail;
        if (!cancelled) setProject(data);
      } catch {
        // transient network error during polling; will retry on next tick
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [project.id, isTerminal]);

  const contentCount = useMemo(() => project.generatedContents.length, [project.generatedContents]);
  // "Aguardando aprovação" at the project level means *some* content in it
  // still needs a human decision — but once at least one piece has already
  // been approved (e.g. the one that triggered a "post agendado" e-mail),
  // showing that banner here reads as if that specific post weren't
  // approved, which it necessarily is (scheduling requires it). Only show
  // the badge for this status when nothing has been decided yet.
  const hasDecidedContent = useMemo(
    () => project.generatedContents.some((c) => ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(c.status)),
    [project.generatedContents]
  );
  const showStatusBadge = project.status !== "WAITING_APPROVAL" || !hasDecidedContent;

  async function handleRetry() {
    setRetrying(true);
    await retryWorkflow(project.id);
    const res = await fetch(`/api/projects/${project.id}`, { cache: "no-store" });
    if (res.ok) setProject((await res.json()) as SerializedProjectDetail);
    setRetrying(false);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Criado em {formatDateTime(project.createdAt)} · {contentCount} conteúdo(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showStatusBadge && <ProjectStatusBadge status={project.status as ProjectStatus} />}
            {project.status === "FAILED" && (
              <Button size="sm" variant="outline" onClick={handleRetry} disabled={retrying} className="gap-1.5">
                <RefreshCcw className={retrying ? "size-3.5 animate-spin" : "size-3.5"} />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>

        <RequestSummary requestOptions={project.requestOptions} />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso do fluxo</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
          {!isTerminal && (
            <p className="text-xs text-muted-foreground">
              A IA local leva alguns minutos por etapa. Pode sair desta página: o trabalho continua e o
              projeto fica aguardando a sua aprovação quando terminar.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <AgentFlow project={project} />

        <div className="flex flex-col gap-6">
          {(project.status === "WAITING_APPROVAL" || project.status === "COMPLETED") && (
            <DeliveryTabs project={project} company={company} />
          )}
          <MessageHistory messages={project.messages} />
        </div>
      </div>
    </div>
  );
}
