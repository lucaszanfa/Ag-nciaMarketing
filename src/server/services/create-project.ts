import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { truncateAtWord } from "@/lib/format";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { runWorkflow } from "@/services/workflow/workflow-runner";

/** Shared by the human-facing "Novo projeto" form and any automation (e.g. n8n) creating projects directly. */
export async function createProjectAndStartWorkflow(originalRequest: string): Promise<{ id: string }> {
  const user = await getCurrentUser();
  const title = truncateAtWord(originalRequest, 80);

  const project = await projectRepository.create({
    title,
    originalRequest,
    createdById: user.id,
  });
  await workflowExecutionRepository.createForProject(project.id);

  // Run the multi-agent flow in the background so the caller isn't blocked by it.
  after(() => runWorkflow(project.id));

  return { id: project.id };
}
