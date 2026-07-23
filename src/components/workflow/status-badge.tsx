import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus, ProjectStatus, ContentStatus } from "@/types/enums";

const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  WAITING: "Aguardando",
  WORKING: "Trabalhando",
  COMPLETED: "Concluído",
  COMPLETED_WITH_FALLBACK: "Concluído (simulado)",
  NEEDS_ADJUSTMENT: "Precisa de ajustes",
  FAILED: "Erro",
  SKIPPED: "Não solicitado",
};

const AGENT_STATUS_CLASS: Record<AgentStatus, string> = {
  WAITING: "bg-muted text-muted-foreground",
  WORKING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  COMPLETED_WITH_FALLBACK: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  NEEDS_ADJUSTMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  FAILED: "bg-destructive/10 text-destructive",
  SKIPPED: "bg-muted text-muted-foreground",
};

export function AgentStatusBadge({ status, className }: { status: AgentStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", AGENT_STATUS_CLASS[status], className)}>
      {AGENT_STATUS_LABEL[status]}
    </Badge>
  );
}

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: "Rascunho",
  RUNNING: "Em andamento",
  WAITING_APPROVAL: "Aguardando aprovação",
  COMPLETED: "Concluído",
  FAILED: "Erro",
  ARCHIVED: "Arquivado",
};

const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  RUNNING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WAITING_APPROVAL: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", PROJECT_STATUS_CLASS[status], className)}
    >
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  );
}

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Rascunho",
  REVIEWED: "Revisado",
  UNDER_AI_REVIEW: "Em revisão pela IA",
  AI_REVISING: "IA corrigindo",
  WAITING_HUMAN_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  NEEDS_ADJUSTMENT: "Precisa de ajustes",
  REJECTED: "Reprovado",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const CONTENT_STATUS_CLASS: Record<ContentStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  REVIEWED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  UNDER_AI_REVIEW: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  AI_REVISING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WAITING_HUMAN_APPROVAL: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  NEEDS_ADJUSTMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REJECTED: "bg-destructive/10 text-destructive",
  SCHEDULED: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function ContentStatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", CONTENT_STATUS_CLASS[status], className)}
    >
      {CONTENT_STATUS_LABEL[status]}
    </Badge>
  );
}
