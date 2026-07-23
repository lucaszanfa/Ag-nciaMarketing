"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { truncateAtWord } from "@/lib/format";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { runWorkflow } from "@/services/workflow/workflow-runner";
import { createProjectSchema } from "@/validations/project.validation";

export type CreateProjectState = { error: string } | null;

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const parsed = createProjectSchema.safeParse({
    originalRequest: formData.get("originalRequest"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Solicitação inválida." };
  }

  const user = await getCurrentUser();
  const title = truncateAtWord(parsed.data.originalRequest, 80);

  const project = await projectRepository.create({
    title,
    originalRequest: parsed.data.originalRequest,
    createdById: user.id,
  });
  await workflowExecutionRepository.createForProject(project.id);

  // Run the (simulated) multi-agent flow in the background so the redirect
  // below isn't blocked by it; the project page polls the DB for progress.
  after(() => runWorkflow(project.id));

  redirect(`/projetos/${project.id}`);
}

export async function deleteProject(projectId: string) {
  await projectRepository.delete(projectId);
  revalidatePath("/projetos");
}

export async function duplicateProject(projectId: string) {
  const duplicate = await projectRepository.duplicate(projectId);
  await workflowExecutionRepository.createForProject(duplicate.id);
  revalidatePath("/projetos");
  return duplicate.id;
}

export async function retryWorkflow(projectId: string) {
  await workflowExecutionRepository.update(projectId, { status: "DRAFT", errorMessage: null });
  await projectRepository.updateStatus(projectId, { status: "DRAFT" });
  after(() => runWorkflow(projectId));
  revalidatePath(`/projetos/${projectId}`);
}
