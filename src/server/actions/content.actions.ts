"use server";

import { revalidatePath } from "next/cache";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { generatedContentVersionRepository } from "@/server/repositories/generated-content-version.repository";
import { contentCommentRepository } from "@/server/repositories/content-comment.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { agentExecutionRepository } from "@/server/repositories/agent-execution.repository";
import { reviewCorrectionCoordinator } from "@/services/workflow/review-correction-coordinator";
import { buildCompanyContext } from "@/services/ai/company-context.service";
import { getCurrentUser } from "@/lib/auth";
import { updateContentSchema, scheduleContentSchema } from "@/validations/content.validation";
import type { Prisma } from "@/generated/prisma/client";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

/**
 * Once no reviewable content in a project is still waiting on a human, the
 * project reaches its actual "Resultado final" — COMPLETED. Called after
 * every human decision so this transition happens automatically, without a
 * separate "finish project" button.
 */
async function maybeCompleteProject(projectId: string) {
  const stillWaiting = await generatedContentRepository.countWaitingApproval(projectId);
  if (stillWaiting > 0) return;

  const project = await projectRepository.findById(projectId);
  if (!project || project.status !== "WAITING_APPROVAL") return;

  const completedAt = new Date();
  await workflowExecutionRepository.update(projectId, { status: "COMPLETED", completedAt });
  await projectRepository.updateStatus(projectId, { status: "COMPLETED", completedAt });
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projetos/${projectId}`);
  revalidatePath("/biblioteca");
  revalidatePath("/projetos");
  revalidatePath("/calendario");
}

export async function approveContent(contentId: string) {
  const content = await generatedContentRepository.updateStatus(contentId, "APPROVED");
  await maybeCompleteProject(content.projectId);
  revalidateProject(content.projectId);
}

export async function rejectContent(contentId: string) {
  const content = await generatedContentRepository.updateStatus(contentId, "REJECTED");
  await maybeCompleteProject(content.projectId);
  revalidateProject(content.projectId);
}

export async function requestContentAdjustment(contentId: string) {
  const content = await generatedContentRepository.updateStatus(contentId, "NEEDS_ADJUSTMENT");
  await maybeCompleteProject(content.projectId);
  revalidateProject(content.projectId);
}

export async function archiveContent(contentId: string) {
  const content = await generatedContentRepository.updateStatus(contentId, "ARCHIVED");
  await maybeCompleteProject(content.projectId);
  revalidateProject(content.projectId);
}

export async function approveAllContent(projectId: string) {
  await generatedContentRepository.decideAllWaitingApproval(projectId, "APPROVED");
  await maybeCompleteProject(projectId);
  revalidateProject(projectId);
}

export async function rejectAllContent(projectId: string) {
  await generatedContentRepository.decideAllWaitingApproval(projectId, "REJECTED");
  await maybeCompleteProject(projectId);
  revalidateProject(projectId);
}

export async function addContentComment(contentId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("O comentário não pode ficar vazio.");

  const content = await generatedContentRepository.findById(contentId);
  if (!content) throw new Error("Conteúdo não encontrado.");

  const user = await getCurrentUser();
  await contentCommentRepository.create({
    generatedContentId: contentId,
    authorName: user.name,
    content: trimmed,
  });

  revalidateProject(content.projectId);
}

/**
 * Human-triggered correction round-trip: sends the content back to the writer
 * that produced it with the given instructions, reusing the same `revise()`
 * infrastructure the automatic Reviewer↔writer cycle uses (Phase 2), but
 * without involving the Reviewer or counting against the automatic limit.
 */
export async function sendContentBackToAgent(contentId: string, instructions: string) {
  const trimmed = instructions.trim();
  if (!trimmed) throw new Error("Escreva as instruções para o redator antes de enviar.");

  const content = await generatedContentRepository.findById(contentId);
  if (!content) throw new Error("Conteúdo não encontrado.");

  const chiefExecution = await agentExecutionRepository.findByProjectAndType(content.projectId, "CHIEF_EDITOR");
  if (!chiefExecution?.output) {
    throw new Error("Planejamento editorial do projeto não encontrado — não é possível corrigir este conteúdo.");
  }

  const company = await buildCompanyContext();

  await reviewCorrectionCoordinator.requestManualRevision(contentId, trimmed, {
    projectId: content.projectId,
    projectTitle: content.project.title,
    originalRequest: content.project.originalRequest,
    company,
    plan: chiefExecution.output as unknown as ChiefEditorPlan,
  });

  revalidateProject(content.projectId);
}

/**
 * Assigns (or changes) a content's publish date/time — the "Data escolhida"
 * step of the editorial calendar. Only takes effect from APPROVED (first
 * schedule) or SCHEDULED (reschedule, including drag-and-drop on the
 * calendar); any other status is left untouched.
 */
export async function scheduleContent(contentId: string, scheduledAtIso: string) {
  const parsed = scheduleContentSchema.parse({ scheduledAt: scheduledAtIso });
  const content = await generatedContentRepository.findById(contentId);
  if (!content) throw new Error("Conteúdo não encontrado.");

  const ok = await generatedContentRepository.updateSchedule(contentId, new Date(parsed.scheduledAt));
  if (!ok) {
    throw new Error(`"${content.title}" precisa estar aprovado para ser agendado.`);
  }

  revalidateProject(content.projectId);
}

/** Manual "Publicado" marking — the flow's other option (integração automática) stays out of scope for now. */
export async function markContentAsPublished(contentId: string) {
  const content = await generatedContentRepository.findById(contentId);
  if (!content) throw new Error("Conteúdo não encontrado.");

  const ok = await generatedContentRepository.markPublished(contentId);
  if (!ok) {
    throw new Error(`"${content.title}" precisa estar agendado para ser marcado como publicado.`);
  }

  revalidateProject(content.projectId);
}

export async function updateContent(contentId: string, input: unknown) {
  const parsed = updateContentSchema.parse(input);
  const current = await generatedContentRepository.findById(contentId);
  if (!current) throw new Error("Conteúdo não encontrado.");

  // Old content may predate versioning entirely — backfill version 1 from what's
  // there now before recording this edit as version currentVersion + 1.
  await generatedContentVersionRepository.ensureInitialVersion(contentId);

  const nextVersion = current.currentVersion + 1;
  await generatedContentRepository.updateContent(contentId, parsed.content as Prisma.InputJsonValue);
  await generatedContentVersionRepository.create({
    generatedContentId: contentId,
    versionNumber: nextVersion,
    contentData: parsed.content as Prisma.InputJsonValue,
    source: "HUMAN_EDIT",
    changeReason: "Edição manual pelo usuário.",
  });
  await generatedContentRepository.updateRevisionState(contentId, { currentVersion: nextVersion });

  revalidateProject(current.projectId);
}
