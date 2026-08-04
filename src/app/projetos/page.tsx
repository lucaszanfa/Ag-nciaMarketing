import { Suspense } from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectRepository } from "@/server/repositories/project.repository";
import { listProjectsQuerySchema } from "@/validations/project.validation";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { ProjectCard } from "@/components/projects/project-card";

export default async function ProjectsPage(props: PageProps<"/projetos">) {
  const rawSearchParams = await props.searchParams;
  const filters = listProjectsQuerySchema.parse({
    search: typeof rawSearchParams.search === "string" ? rawSearchParams.search : undefined,
    status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : undefined,
  });

  const projects = await projectRepository.list(filters);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Projetos</h1>
        <Button render={<Link href="/" />} nativeButton={false} className="gap-1.5">
          <Plus className="size-4" />
          Novo projeto
        </Button>
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
