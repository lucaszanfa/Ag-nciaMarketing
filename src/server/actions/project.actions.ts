"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { runWorkflow } from "@/services/workflow/workflow-runner";
import { createProjectAndStartWorkflow } from "@/server/services/create-project";
import { createProjectSchema } from "@/validations/project.validation";
import { requireRole } from "@/lib/auth";
import { requestOptionsSchema } from "@/lib/project-request";

export type CreateProjectState = { error: string } | null;

function optionalString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  await requireRole("ADMIN", "CEO", "COMMON");

  const parsed = createProjectSchema.safeParse({
    originalRequest: formData.get("originalRequest"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Solicitação inválida." };
  }

  const quantity = optionalString(formData.get("quantity"));
  const options = requestOptionsSchema.safeParse({
    channels: formData.getAll("channels").filter((v) => typeof v === "string" && v !== ""),
    quantity: quantity ? Number(quantity) : null,
    objective: optionalString(formData.get("objective")),
    period: optionalString(formData.get("period")),
  });

  if (!options.success) {
    return { error: "Opções do pedido inválidas. Recarregue a página e tente de novo." };
  }

  const { id } = await createProjectAndStartWorkflow(parsed.data.originalRequest, {
    requestOptions: options.data,
  });

  redirect(`/projetos/${id}`);
}

export async function deleteProject(projectId: string) {
  await requireRole("CEO");
  await projectRepository.delete(projectId);
  revalidatePath("/projetos");
}

export async function duplicateProject(projectId: string) {
  await requireRole("CEO");
  const duplicate = await projectRepository.duplicate(projectId);
  await workflowExecutionRepository.createForProject(duplicate.id);
  revalidatePath("/projetos");
  return duplicate.id;
}

export async function retryWorkflow(projectId: string) {
  await requireRole("CEO");
  await workflowExecutionRepository.update(projectId, { status: "DRAFT", errorMessage: null });
  await projectRepository.updateStatus(projectId, { status: "DRAFT" });
  after(() => runWorkflow(projectId));
  revalidatePath(`/projetos/${projectId}`);
}
