import { notFound } from "next/navigation";
import { projectRepository } from "@/server/repositories/project.repository";
import { ProjectWorkspace } from "@/components/workflow/project-workspace";

export default async function ProjectPage(props: PageProps<"/projetos/[id]">) {
  const { id } = await props.params;
  const project = await projectRepository.findById(id);

  if (!project) notFound();

  return <ProjectWorkspace initialProject={project} />;
}
