import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/workflow/status-badge";
import { ProjectCardActions } from "./project-card-actions";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";
import type { ProjectStatus } from "@/types/enums";

type ProjectListItem = Prisma.ProjectGetPayload<{
  include: { _count: { select: { generatedContents: true } } };
}>;

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <Link href={`/projetos/${project.id}`} className="font-semibold hover:underline">
            {project.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.originalRequest}</p>
        </div>
        <ProjectCardActions projectId={project.id} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <ProjectStatusBadge status={project.status as ProjectStatus} />
          <span className="text-xs text-muted-foreground">{project._count.generatedContents} conteúdo(s)</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground">Atualizado em {formatDateTime(project.updatedAt)}</p>
      </CardContent>
    </Card>
  );
}
