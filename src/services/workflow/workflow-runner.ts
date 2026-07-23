import { prisma } from "@/lib/prisma";
import { projectRepository } from "@/server/repositories/project.repository";
import { workflowExecutionRepository } from "@/server/repositories/workflow-execution.repository";
import { agentExecutionRepository } from "@/server/repositories/agent-execution.repository";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { generatedContentVersionRepository } from "@/server/repositories/generated-content-version.repository";
import { reviewerAgent, type ReviewableContent } from "@/services/ai/agents/reviewer.agent";
import { linkedInWriterAgent } from "@/services/ai/agents/linkedin-writer.agent";
import { instagramWriterAgent } from "@/services/ai/agents/instagram-writer.agent";
import { campaignWriterAgent } from "@/services/ai/agents/campaign-writer.agent";
import { chiefEditorAgent } from "@/services/ai/agents/chief-editor.agent";
import { buildCompanyContext } from "@/services/ai/company-context.service";
import { buildContentCopyText } from "@/lib/content-text";
import { getAiConfig } from "@/services/ai/config";
import {
  reviewCorrectionCoordinator,
  type ContentToReview,
  type ContentReviewCycleResult,
} from "./review-correction-coordinator";
import { messageRepository } from "@/server/repositories/message.repository";
import { notifyPendingApproval } from "@/services/notifications/n8n-webhook";
import { generateAndStoreContentImage } from "@/services/ai/generate-and-store-image";
import type { AgentRunResult } from "@/services/ai/agent-runner";
import type { Prisma } from "@/generated/prisma/client";
import type { AgentStatus, AgentType, ContentFormat, Platform } from "@/types/enums";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateProjectProgress(projectId: string, progress: number) {
  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { progress } }),
    prisma.workflowExecution.update({ where: { projectId }, data: { progress } }),
  ]);
}

function executionStatus(usedFallback: boolean): AgentStatus {
  return usedFallback ? "COMPLETED_WITH_FALLBACK" : "COMPLETED";
}

/** Friendly, per-agent message for the project timeline describing how the run went. */
function runOutcomeMessage(agentLabel: string, result: AgentRunResult<unknown>): string {
  if (!result.usedFallback) return `Resposta recebida do ${agentLabel} (IA real).`;
  if (result.errorMessage) return result.errorMessage;
  return `${agentLabel}: IA não configurada — usando resposta simulada.`;
}

async function persistAgentMetrics(executionId: string, result: AgentRunResult<unknown>) {
  await agentExecutionRepository.update(executionId, {
    provider: result.provider,
    model: result.model,
    promptVersion: result.promptVersion,
    inputTokens: result.usage?.inputTokens ?? null,
    outputTokens: result.usage?.outputTokens ?? null,
    totalTokens: result.usage?.totalTokens ?? null,
    retryCount: result.retryCount,
    usedFallback: result.usedFallback,
  });
}

/** Creates the version-1 row for a just-generated content item (best-effort, non-fatal). */
async function createInitialVersion(contentId: string, agentType: AgentType, contentData: unknown) {
  await generatedContentVersionRepository.create({
    generatedContentId: contentId,
    versionNumber: 1,
    contentData: contentData as Prisma.InputJsonValue,
    source: "INITIAL_GENERATION",
    createdByAgent: agentType,
    revisionAttempt: 0,
  });
}

/**
 * Orchestrates the multi-agent flow for a project, persisting every state
 * transition to the database as it happens (not just animating on the
 * client). Intended to be started via `after()` right after project creation
 * so it doesn't block the redirect response.
 */
export async function runWorkflow(projectId: string): Promise<void> {
  const workflow = await workflowExecutionRepository.findByProjectId(projectId);
  if (
    !workflow ||
    workflow.status === "RUNNING" ||
    workflow.status === "WAITING_APPROVAL" ||
    workflow.status === "COMPLETED"
  ) {
    return; // idempotency guard: never start the same project's flow twice
  }

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const company = await buildCompanyContext();
  const aiConfig = getAiConfig();

  await workflowExecutionRepository.update(projectId, {
    status: "RUNNING",
    currentAgent: "CEO",
    startedAt: new Date(),
  });
  await projectRepository.updateStatus(projectId, { status: "RUNNING" });

  // Tracks whichever single-agent AgentExecution is currently in flight so the
  // catch block below can mark that specific agent (not just the project) as
  // FAILED. The 3 writers that run in parallel manage their own FAILED state
  // individually (see the Promise.all block) since there's no single "current" one.
  let currentExecutionId: string | null = null;

  try {
    // 1. CEO — represents the request itself, already "done" the moment it was submitted
    const ceoExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "CEO",
      status: "COMPLETED",
      input: { originalRequest: project.originalRequest },
    });
    await agentExecutionRepository.update(ceoExecution.id, {
      status: "COMPLETED",
      progress: 100,
      startedAt: project.createdAt,
      completedAt: project.createdAt,
      currentMessage: "Solicitação enviada",
      output: { originalRequest: project.originalRequest },
    });
    await messageRepository.create({
      projectId,
      authorType: "CEO",
      agentType: "CEO",
      content: project.originalRequest,
    });
    await updateProjectProgress(projectId, 10);

    // 2. Chief Editor
    await workflowExecutionRepository.update(projectId, { currentAgent: "CHIEF_EDITOR" });
    const chiefExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "CHIEF_EDITOR",
      status: "WORKING",
      input: { originalRequest: project.originalRequest },
    });
    currentExecutionId = chiefExecution.id;
    await agentExecutionRepository.update(chiefExecution.id, {
      startedAt: new Date(),
      currentMessage: "Analisando a solicitação e definindo o planejamento editorial",
      progress: 50,
    });
    await sleep(600);

    const chiefResult = await chiefEditorAgent.execute({ originalRequest: project.originalRequest, company });
    const aiPlan = chiefResult.data;

    await agentExecutionRepository.update(chiefExecution.id, {
      status: executionStatus(chiefResult.usedFallback),
      progress: 100,
      completedAt: new Date(),
      currentMessage: "Planejamento editorial concluído",
      output: aiPlan as unknown as Prisma.InputJsonValue,
    });
    await persistAgentMetrics(chiefExecution.id, chiefResult);
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "CHIEF_EDITOR",
      content: runOutcomeMessage("editor-chefe", chiefResult),
    });
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "CHIEF_EDITOR",
      content: `Planejamento criado: ${aiPlan.objective}`,
    });
    currentExecutionId = null;

    // Persist the content plan as briefings (no posts written yet — that's the writers' job below).
    await generatedContentRepository.createMany(
      aiPlan.contentPlan.map((item) => ({
        projectId,
        agentExecutionId: chiefExecution.id,
        platform: item.platform as Platform,
        format: item.format as ContentFormat,
        title: item.theme,
        content: {
          objective: item.objective,
          briefing: item.briefing,
          suggestedDate: item.suggestedDate,
        } as Prisma.InputJsonValue,
      }))
    );

    const linkedinBriefs = aiPlan.contentPlan.filter((item) => item.platform === "LINKEDIN");
    const instagramBriefs = aiPlan.contentPlan.filter((item) => item.platform === "INSTAGRAM");
    const campaignBriefs = aiPlan.contentPlan.filter((item) => item.format === "CAMPAIGN_PLAN");

    // The Chief Editor's plan is scoped to only the platform(s) the CEO's request actually
    // calls for — when a writer has no briefs, skip its real AI call entirely instead of
    // running it with nothing to do.
    const shouldRunLinkedin = linkedinBriefs.length > 0;
    const shouldRunInstagram = instagramBriefs.length > 0;
    const shouldRunCampaign = campaignBriefs.length > 0;

    function skippedWriterResult<T>(emptyData: T): AgentRunResult<T> {
      return {
        data: emptyData,
        usedFallback: false,
        retryCount: 0,
        provider: null,
        model: null,
        promptVersion: "skipped",
        usage: null,
        durationMs: null,
        errorMessage: null,
      };
    }

    await updateProjectProgress(projectId, 30);

    // 3-5. LinkedIn / Instagram / Campaign writers run in parallel once briefings exist.
    await workflowExecutionRepository.update(projectId, { currentAgent: "LINKEDIN_WRITER" });
    const linkedinExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "LINKEDIN_WRITER",
      status: "WORKING",
      input: { briefs: linkedinBriefs } as unknown as Prisma.InputJsonValue,
    });
    await agentExecutionRepository.update(linkedinExecution.id, {
      startedAt: new Date(),
      currentMessage: "Escrevendo posts para LinkedIn",
      progress: 40,
    });

    await workflowExecutionRepository.update(projectId, { currentAgent: "INSTAGRAM_WRITER" });
    const instagramExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "INSTAGRAM_WRITER",
      status: "WORKING",
      input: { briefs: instagramBriefs } as unknown as Prisma.InputJsonValue,
    });
    await agentExecutionRepository.update(instagramExecution.id, {
      startedAt: new Date(),
      currentMessage: "Montando o carrossel e o roteiro de Reels",
      progress: 40,
    });

    await workflowExecutionRepository.update(projectId, { currentAgent: "CAMPAIGN_WRITER" });
    const campaignExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "CAMPAIGN_WRITER",
      status: "WORKING",
      input: { briefs: campaignBriefs } as unknown as Prisma.InputJsonValue,
    });
    await agentExecutionRepository.update(campaignExecution.id, {
      startedAt: new Date(),
      currentMessage: "Avaliando a necessidade de uma campanha institucional",
      progress: 40,
    });

    async function runWriter<T>(executionId: string, run: () => Promise<T>): Promise<T> {
      try {
        return await run();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no agente.";
        await agentExecutionRepository.update(executionId, {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage,
        });
        throw error;
      }
    }

    const [linkedinResult, instagramResult, campaignResult] = await Promise.all([
      shouldRunLinkedin
        ? runWriter(linkedinExecution.id, () =>
            linkedInWriterAgent.execute({ originalRequest: project.originalRequest, plan: aiPlan, briefs: linkedinBriefs, company })
          )
        : Promise.resolve(skippedWriterResult({ posts: [] })),
      shouldRunInstagram
        ? runWriter(instagramExecution.id, () =>
            instagramWriterAgent.execute({ originalRequest: project.originalRequest, plan: aiPlan, briefs: instagramBriefs, company })
          )
        : Promise.resolve(skippedWriterResult({ carousels: [], reels: [], posts: [], stories: [] })),
      shouldRunCampaign
        ? runWriter(campaignExecution.id, () =>
            campaignWriterAgent.execute({ originalRequest: project.originalRequest, plan: aiPlan, briefs: campaignBriefs, company })
          )
        : Promise.resolve(
            skippedWriterResult({
              required: false,
              name: "",
              concept: "",
              objective: "",
              slogan: null,
              mainMessage: "",
              targetAudience: "",
              durationWeeks: 1,
              phases: [],
              channels: [],
              cta: "",
              pieceIdeas: [],
              schedule: [],
              recommendedMetrics: [],
              risks: [],
              writerInstructions: [],
            })
          ),
    ]);

    // Persist LinkedIn content
    const linkedinOutput = linkedinResult.data;
    const linkedinContents = await generatedContentRepository.createMany(
      linkedinOutput.posts.map((post) => ({
        projectId,
        agentExecutionId: linkedinExecution.id,
        platform: "LINKEDIN" as const,
        format: "POST" as const,
        title: post.internalTitle,
        content: post as unknown as Prisma.InputJsonValue,
        maxAutomaticRevisions: aiConfig.maxAutomaticRevisions,
        metadata: {
          hashtags: post.hashtags,
          visualSuggestion: post.visualSuggestion,
          briefId: post.briefId,
          isSimulated: linkedinResult.usedFallback,
          promptVersion: linkedinResult.promptVersion,
        } as Prisma.InputJsonValue,
      }))
    );
    await Promise.all(linkedinContents.map((c, i) => createInitialVersion(c.id, "LINKEDIN_WRITER", linkedinOutput.posts[i])));
    await Promise.all(
      linkedinContents.map((c, i) => generateAndStoreContentImage(c.id, linkedinOutput.posts[i].visualSuggestion, "1:1"))
    );
    await agentExecutionRepository.update(linkedinExecution.id, {
      status: shouldRunLinkedin ? executionStatus(linkedinResult.usedFallback) : "SKIPPED",
      progress: 100,
      completedAt: new Date(),
      currentMessage: shouldRunLinkedin
        ? `${linkedinOutput.posts.length} posts para LinkedIn criados`
        : "Não solicitado para este pedido",
      output: linkedinOutput as unknown as Prisma.InputJsonValue,
    });
    await persistAgentMetrics(linkedinExecution.id, linkedinResult);
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "LINKEDIN_WRITER",
      content: shouldRunLinkedin
        ? runOutcomeMessage("Redator LinkedIn", linkedinResult)
        : "Redator LinkedIn: não solicitado para este pedido.",
    });

    // Persist Instagram content
    const instagramOutput = instagramResult.data;
    const instagramContentInputs = [
      ...instagramOutput.carousels.map((c) => ({
        platform: "INSTAGRAM" as const,
        format: "CAROUSEL" as const,
        title: c.internalTitle,
        content: c as unknown as Prisma.InputJsonValue,
        data: c as unknown,
        metadata: {
          hashtags: c.hashtags,
          visualSuggestion: c.visualSuggestion,
          briefId: c.briefId,
          isSimulated: instagramResult.usedFallback,
          promptVersion: instagramResult.promptVersion,
        } as Prisma.InputJsonValue,
      })),
      ...instagramOutput.reels.map((r) => ({
        platform: "INSTAGRAM" as const,
        format: "REELS" as const,
        title: r.internalTitle,
        content: r as unknown as Prisma.InputJsonValue,
        data: r as unknown,
        metadata: {
          hashtags: r.hashtags,
          visualSuggestion: r.visualSuggestion,
          briefId: r.briefId,
          isSimulated: instagramResult.usedFallback,
          promptVersion: instagramResult.promptVersion,
        } as Prisma.InputJsonValue,
      })),
      ...instagramOutput.posts.map((p) => ({
        platform: "INSTAGRAM" as const,
        format: "POST" as const,
        title: p.internalTitle,
        content: p as unknown as Prisma.InputJsonValue,
        data: p as unknown,
        metadata: {
          hashtags: p.hashtags,
          visualSuggestion: p.visualSuggestion,
          briefId: p.briefId,
          isSimulated: instagramResult.usedFallback,
          promptVersion: instagramResult.promptVersion,
        } as Prisma.InputJsonValue,
      })),
      ...instagramOutput.stories.map((s) => ({
        platform: "INSTAGRAM" as const,
        format: "STORIES" as const,
        title: s.internalTitle,
        content: s as unknown as Prisma.InputJsonValue,
        data: s as unknown,
        metadata: {
          visualSuggestion: s.visualSuggestion,
          briefId: s.briefId,
          isSimulated: instagramResult.usedFallback,
          promptVersion: instagramResult.promptVersion,
        } as Prisma.InputJsonValue,
      })),
    ];
    const instagramContents = await generatedContentRepository.createMany(
      instagramContentInputs.map(({ data: _data, ...c }) => ({
        ...c,
        projectId,
        agentExecutionId: instagramExecution.id,
        maxAutomaticRevisions: aiConfig.maxAutomaticRevisions,
      }))
    );
    await Promise.all(
      instagramContents.map((c, i) => createInitialVersion(c.id, "INSTAGRAM_WRITER", instagramContentInputs[i].data))
    );
    await Promise.all(
      instagramContents.map((c, i) => {
        const item = instagramContentInputs[i];
        const visualSuggestion = (item.data as { visualSuggestion: string }).visualSuggestion;
        const aspectRatio = item.format === "REELS" || item.format === "STORIES" ? "9:16" : "1:1";
        return generateAndStoreContentImage(c.id, visualSuggestion, aspectRatio);
      })
    );
    await agentExecutionRepository.update(instagramExecution.id, {
      status: shouldRunInstagram ? executionStatus(instagramResult.usedFallback) : "SKIPPED",
      progress: 100,
      completedAt: new Date(),
      currentMessage: shouldRunInstagram
        ? `${instagramContents.length} conteúdos para Instagram criados`
        : "Não solicitado para este pedido",
      output: instagramOutput as unknown as Prisma.InputJsonValue,
    });
    await persistAgentMetrics(instagramExecution.id, instagramResult);
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "INSTAGRAM_WRITER",
      content: shouldRunInstagram
        ? runOutcomeMessage("Redator Instagram", instagramResult)
        : "Redator Instagram: não solicitado para este pedido.",
    });

    // Persist Campaign content (always creates a row, even when `required` is false,
    // so the delivery screen can explain that no campaign was needed instead of
    // looking unfinished).
    const campaignOutput = campaignResult.data;
    const campaignContent = await generatedContentRepository.create({
      projectId,
      agentExecutionId: campaignExecution.id,
      platform: "GENERAL",
      format: "CAMPAIGN_PLAN",
      title: campaignOutput.required ? campaignOutput.name : "Nenhuma campanha necessária",
      content: campaignOutput as unknown as Prisma.InputJsonValue,
      maxAutomaticRevisions: aiConfig.maxAutomaticRevisions,
      metadata: {
        isSimulated: campaignResult.usedFallback,
        promptVersion: campaignResult.promptVersion,
      } as Prisma.InputJsonValue,
    });
    await createInitialVersion(campaignContent.id, "CAMPAIGN_WRITER", campaignOutput);
    await agentExecutionRepository.update(campaignExecution.id, {
      status: shouldRunCampaign ? executionStatus(campaignResult.usedFallback) : "SKIPPED",
      progress: 100,
      completedAt: new Date(),
      currentMessage: !shouldRunCampaign
        ? "Não solicitado para este pedido"
        : campaignOutput.required
          ? "Campanha estruturada"
          : "Nenhuma campanha necessária para esta solicitação",
      output: campaignOutput as unknown as Prisma.InputJsonValue,
    });
    await persistAgentMetrics(campaignExecution.id, campaignResult);
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "CAMPAIGN_WRITER",
      content: shouldRunCampaign
        ? runOutcomeMessage("Redator de campanhas", campaignResult)
        : "Redator de campanhas: não solicitado para este pedido.",
    });

    await updateProjectProgress(projectId, 70);

    // 6. Reviewer — first pass judges every writer-produced content at once. Only
    // runs after every writer's content is persisted.
    await workflowExecutionRepository.update(projectId, { currentAgent: "REVIEWER" });
    const reviewerExecution = await agentExecutionRepository.create({
      projectId,
      agentType: "REVIEWER",
      status: "WORKING",
    });
    currentExecutionId = reviewerExecution.id;
    await agentExecutionRepository.update(reviewerExecution.id, {
      startedAt: new Date(),
      currentMessage: "Revisando os conteúdos",
      progress: 50,
    });

    // Exclude the Chief Editor's own briefings and the campaign row when no
    // campaign was actually produced — the Reviewer only judges finished,
    // applicable deliverables.
    const allContents = await prisma.generatedContent.findMany({
      where: { projectId, agentExecutionId: { not: chiefExecution.id } },
      include: { agentExecution: { select: { agentType: true } } },
    });
    const reviewableRows = allContents.filter((c) => c.id !== campaignContent.id || campaignOutput.required);
    const reviewableContents: ReviewableContent[] = reviewableRows.map((c) => ({
      id: c.id,
      platform: c.platform,
      format: c.format,
      title: c.title,
      contentText: buildContentCopyText(c.format as ContentFormat, c.content),
    }));

    const reviewerResult = await reviewerAgent.execute({
      originalRequest: project.originalRequest,
      contents: reviewableContents,
      company,
    });
    const reviewerJudgmentsById = new Map(reviewerResult.data.reviews.map((r) => [r.generatedContentId, r]));

    await persistAgentMetrics(reviewerExecution.id, reviewerResult);
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "REVIEWER",
      content: runOutcomeMessage("Revisor", reviewerResult),
    });
    currentExecutionId = null;

    // 7. Automatic correction cycle — coordinated here, never agent-to-agent. Each
    // content item runs its own independent loop (parallel across contents);
    // the coordinator's per-content status transitions prevent the same
    // content from being revised twice at once.
    const executionIdByAgentType: Partial<Record<AgentType, string>> = {
      LINKEDIN_WRITER: linkedinExecution.id,
      INSTAGRAM_WRITER: instagramExecution.id,
      CAMPAIGN_WRITER: campaignExecution.id,
    };
    const coordinatorContext = {
      projectId,
      projectTitle: project.title,
      originalRequest: project.originalRequest,
      company,
      plan: aiPlan,
    };

    const cycleResults = await Promise.all(
      reviewableRows.map((row): Promise<ContentReviewCycleResult> => {
        const judgment = reviewerJudgmentsById.get(row.id);
        const agentType = row.agentExecution.agentType as AgentType;
        if (!judgment) {
          // Reviewer's batch response didn't cover this content — treat as needing human attention.
          return Promise.resolve({
            contentId: row.id,
            contentTitle: row.title,
            platform: row.platform,
            format: row.format,
            agentType,
            usedFallback: reviewerResult.usedFallback,
            automaticRevisionCount: 0,
            finalDecision: "NEEDS_ADJUSTMENT" as const,
            reachedWaitingApproval: false,
            reason: null,
          });
        }
        const contentToReview: ContentToReview = {
          id: row.id,
          platform: row.platform as Platform,
          format: row.format as ContentFormat,
          title: row.title,
          content: row.content,
          agentType,
          maxAutomaticRevisions: row.maxAutomaticRevisions,
        };
        return reviewCorrectionCoordinator.processContentReviewCycle(
          contentToReview,
          judgment,
          coordinatorContext,
          executionIdByAgentType[agentType] ?? null,
          reviewerExecution.id
        );
      })
    );

    // One aggregated notification per project instead of one per content —
    // several items typically reach WAITING_HUMAN_APPROVAL together here.
    await notifyPendingApproval({
      projectId,
      projectTitle: project.title,
      items: cycleResults
        .filter((r) => r.reachedWaitingApproval && r.reason)
        .map((r) => ({
          contentId: r.contentId,
          contentTitle: r.contentTitle,
          platform: r.platform,
          format: r.format,
          reason: r.reason!,
        })),
    });

    // Roll each writer's AgentExecution back up to a single final status/message —
    // reopened to WORKING per-content during the loop above, closed once here.
    for (const [agentType, executionId] of Object.entries(executionIdByAgentType) as [AgentType, string][]) {
      const ownResults = cycleResults.filter((r) => r.agentType === agentType);
      const totalRevisions = ownResults.reduce((sum, r) => sum + r.automaticRevisionCount, 0);
      if (totalRevisions === 0) continue; // nothing to roll up — initial COMPLETED status already stands
      const usedFallback = ownResults.some((r) => r.usedFallback);
      await agentExecutionRepository.update(executionId, {
        status: executionStatus(usedFallback),
        completedAt: new Date(),
        currentMessage: `${totalRevisions} correção(ões) automática(s) aplicada(s) em ${ownResults.length} conteúdo(s)`,
      });
      if (usedFallback) {
        await agentExecutionRepository.update(executionId, { usedFallback: true });
      }
    }

    const totalRevisionsOverall = cycleResults.reduce((sum, r) => sum + r.automaticRevisionCount, 0);
    const reviewerUsedFallbackOverall = reviewerResult.usedFallback || cycleResults.some((r) => r.usedFallback);
    await agentExecutionRepository.update(reviewerExecution.id, {
      status: executionStatus(reviewerUsedFallbackOverall),
      progress: 100,
      completedAt: new Date(),
      currentMessage:
        totalRevisionsOverall > 0
          ? `Revisão concluída após ${totalRevisionsOverall} correção(ões) automática(s)`
          : "Revisão concluída",
      output: reviewerResult.data as unknown as Prisma.InputJsonValue,
    });
    if (reviewerUsedFallbackOverall) {
      await agentExecutionRepository.update(reviewerExecution.id, { usedFallback: true });
    }

    const approvedCount = cycleResults.filter((r) => r.finalDecision === "APPROVED").length;
    await messageRepository.create({
      projectId,
      authorType: "AGENT",
      agentType: "REVIEWER",
      content: `Ciclo de revisão concluído: ${approvedCount} de ${cycleResults.length} conteúdo(s) aprovados pela IA, ${totalRevisionsOverall} correção(ões) automática(s) no total.`,
    });
    await updateProjectProgress(projectId, 95);

    // 8. Final delivery — waits for human approval instead of auto-completing.
    await sleep(300);
    const completedAt = new Date();
    await workflowExecutionRepository.update(projectId, {
      status: "WAITING_APPROVAL",
      currentAgent: null,
      progress: 100,
      completedAt,
    });
    await projectRepository.updateStatus(projectId, {
      status: "WAITING_APPROVAL",
      progress: 100,
      completedAt,
    });
    await messageRepository.create({
      projectId,
      authorType: "SYSTEM",
      content: "Fluxo concluído. A entrega final está disponível e aguarda aprovação humana.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no fluxo.";
    if (currentExecutionId) {
      await agentExecutionRepository.update(currentExecutionId, {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage,
      });
    }
    await workflowExecutionRepository.update(projectId, { status: "FAILED", errorMessage });
    await projectRepository.updateStatus(projectId, { status: "FAILED" });
    await messageRepository.create({
      projectId,
      authorType: "SYSTEM",
      content: `O fluxo falhou: ${errorMessage}. Você pode tentar novamente.`,
    });
  }
}
