import { Suspense } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Hourglass, CheckCircle2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectRepository } from "@/server/repositories/project.repository";
import { listProjectsQuerySchema } from "@/validations/project.validation";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-xs ring-1 ring-foreground/[0.06]">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-semibold tracking-tight">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function ProjectsPage(props: PageProps<"/projetos">) {
  const rawSearchParams = await props.searchParams;
  const filters = listProjectsQuerySchema.parse({
    search: typeof rawSearchParams.search === "string" ? rawSearchParams.search : undefined,
    status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : undefined,
  });

  // Comum only sees projects they created themselves; CEO/Admin see everyone's.
  const user = await getCurrentUser();
  const scopedCreatedById = user?.role === "COMMON" ? user.id : undefined;
  const [projects, stats] = await Promise.all([
    projectRepository.list({ ...filters, createdById: scopedCreatedById }),
    projectRepository.countByStatus(scopedCreatedById),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe e gerencie os pedidos em andamento.</p>
        </div>
        <Button render={<Link href="/" />} nativeButton={false} size="lg" className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          Novo projeto
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatPill
          icon={LayoutGrid}
          label="Total de projetos"
          value={stats.total}
          accent="bg-primary/10 text-primary"
        />
        <StatPill
          icon={Hourglass}
          label="Aguardando aprovação"
          value={stats.waitingApproval}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatPill
          icon={CheckCircle2}
          label="Concluídos"
          value={stats.completed}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <Suspense>
        <ProjectsToolbar />
      </Suspense>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
          <Button render={<Link href="/" />} nativeButton={false} variant="outline" size="sm">
            Criar o primeiro projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
