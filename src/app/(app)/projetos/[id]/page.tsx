import { brandFromSettings } from "@/lib/social";
import { notFound } from "next/navigation";
import { projectRepository } from "@/server/repositories/project.repository";
import { settingsRepository } from "@/server/repositories/settings.repository";
import { ProjectWorkspace } from "@/components/workflow/project-workspace";
import { getCurrentUser } from "@/lib/auth";

export default async function ProjectPage(props: PageProps<"/projetos/[id]">) {
  const { id } = await props.params;
  const [project, settings] = await Promise.all([projectRepository.findById(id), settingsRepository.get()]);

  if (!project) notFound();

  // Comum can only open their own projects — CEO/Admin can open any.
  const user = await getCurrentUser();
  if (user?.role === "COMMON" && project.createdById !== user.id) notFound();

  return (
    <ProjectWorkspace
      initialProject={project}
      company={brandFromSettings(settings)}
    />
  );
}
