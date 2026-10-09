import Link from "next/link";
import { FileEdit, Loader2, Hourglass, CheckCircle2, AlertTriangle, Archive, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/workflow/status-badge";
import { ProjectCardActions } from "./project-card-actions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import type { ProjectStatus } from "@/types/enums";

type ProjectListItem = Prisma.ProjectGetPayload<{
  include: { _count: { select: { generatedContents: true } }; createdBy: { select: { name: true } } };
}>;

// Workflow progress sits at 100% for the rest of a project's life once the agent pipeline
// finishes — showing that bar past this point is always-full noise, not information.
const PROGRESS_VISIBLE_STATUSES = new Set(["DRAFT", "RUNNING"]);

const STATUS_ACCENT: Record<ProjectStatus, { bar: string; icon: LucideIcon; iconClass: string }> = {
  DRAFT: { bar: "bg-muted-foreground/30", icon: FileEdit, iconClass: "bg-muted text-muted-foreground" },
  RUNNING: { bar: "bg-primary", icon: Loader2, iconClass: "bg-primary/10 text-primary" },
  WAITING_APPROVAL: {
    bar: "bg-amber-500",
    icon: Hourglass,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  COMPLETED: {
    bar: "bg-emerald-500",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FAILED: { bar: "bg-destructive", icon: AlertTriangle, iconClass: "bg-destructive/10 text-destructive" },
  ARCHIVED: { bar: "bg-muted-foreground/30", icon: Archive, iconClass: "bg-muted text-muted-foreground" },
};

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const status = project.status as ProjectStatus;
  const accent = STATUS_ACCENT[status];
  const Icon = accent.icon;

  return (
    <Card
      className={cn(
        "group relative gap-3 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      )}
    >
      <div className={cn("h-1 w-full", accent.bar)} />
      <Link href={`/projetos/${project.id}`} className="absolute inset-0 z-0" aria-label={project.title} />
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pt-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accent.iconClass)}>
            <Icon className={cn("size-4.5", status === "RUNNING" && "animate-spin")} />
          </div>
          <p className="line-clamp-2 min-w-0 pt-1 leading-snug font-semibold group-hover:underline">
            {project.title}
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <ProjectCardActions projectId={project.id} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <ProjectStatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{project._count.generatedContents} conteúdo(s)</span>
        </div>
        {PROGRESS_VISIBLE_STATUSES.has(status) && <Progress value={project.progress} className="h-1.5" />}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">Por {project.createdBy.name}</span>
          <span className="shrink-0">Atualizado em {formatDateTime(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
