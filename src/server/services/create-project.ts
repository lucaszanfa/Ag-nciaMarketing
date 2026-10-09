import { after } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, getSystemUser } from "@/lib/auth";
import { truncateAtWord, stripMarkdown } from "@/lib/format";
import { composeRequestText, type RequestOptions } from "@/lib/project-request";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { runWorkflow } from "@/services/workflow/workflow-runner";

export interface CreateProjectOptions {
  /** Structured options (channels, quantity, objective, period, news hook) — see project-request.ts. */
  requestOptions?: RequestOptions | null;
  /** Initial title; the Chief Editor replaces it with a better one once it runs. */
  title?: string;
  /**
   * When false, the caller is responsible for running the workflow (e.g. to run several
   * projects one after another instead of all at once against a single local model).
   */
  startWorkflow?: boolean;
}

/**
 * Shared by the human-facing "Novo projeto" form and any automation (e.g.
 * n8n) creating projects directly through the API. The form always has a
 * logged-in session; automations don't, so they're attributed to the
 * instance's admin instead (see `getSystemUser`).
 */
export async function createProjectAndStartWorkflow(
  description: string,
  options: CreateProjectOptions = {}
): Promise<{ id: string }> {
  const user = (await getCurrentUser()) ?? (await getSystemUser());
  const requestOptions = options.requestOptions ?? null;
  const title = truncateAtWord(stripMarkdown(options.title ?? description), 80);

  const project = await projectRepository.create({
    title,
    originalRequest: composeRequestText(description, requestOptions),
    requestOptions: (requestOptions ?? undefined) as Prisma.InputJsonValue | undefined,
    createdById: user.id,
  });
  await workflowExecutionRepository.createForProject(project.id);

  // Run the multi-agent flow in the background so the caller isn't blocked by it.
  if (options.startWorkflow !== false) after(() => runWorkflow(project.id));

  return { id: project.id };
}
