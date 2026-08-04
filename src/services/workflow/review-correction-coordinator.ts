import type { Prisma } from "@/generated/prisma/client";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { generatedContentVersionRepository } from "@/server/repositories/generated-content-version.repository";
import { reviewRepository } from "@/server/repositories/review.repository";
import { messageRepository } from "@/server/repositories/message.repository";
import { agentExecutionRepository } from "@/server/repositories/agent-execution.repository";
import { AGENT_META } from "@/lib/agent-meta";
import { linkedInWriterAgent } from "@/services/ai/agents/linkedin-writer.agent";
import { instagramWriterAgent } from "@/services/ai/agents/instagram-writer.agent";
import { campaignWriterAgent } from "@/services/ai/agents/campaign-writer.agent";
import { reviewerAgent } from "@/services/ai/agents/reviewer.agent";
import { buildContentCopyText } from "@/lib/content-text";
import { notifyPendingApproval, type PendingApprovalReason } from "@/services/notifications/n8n-webhook";
import type { AgentRunResult } from "@/services/ai/agent-runner";
import type { CompanyContext, PreviousContentVersion, RevisionInput } from "@/services/ai/types";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";
import type { ContentReview, ReviewDecision } from "@/services/ai/schemas/reviewer.schema";
import type { AgentType, ContentFormat, ContentVersionSource, Platform } from "@/types/enums";

export interface CoordinatorContext {
  projectId: string;
  projectTitle: string;
  originalRequest: string;
  company: CompanyContext;
  plan: ChiefEditorPlan;
}

export interface ContentToReview {
  id: string;
  platform: Platform;
  format: ContentFormat;
  title: string;
  content: unknown;
  agentType: AgentType;
  maxAutomaticRevisions: number;
}

export interface ContentReviewCycleResult {
  contentId: string;
  contentTitle: string;
  platform: string;
  format: string;
  agentType: AgentType;
  usedFallback: boolean;
  automaticRevisionCount: number;
  finalDecision: ReviewDecision;
  /** True once this content actually transitioned to WAITING_HUMAN_APPROVAL (vs. skipped/stuck). */
  reachedWaitingApproval: boolean;
  reason: PendingApprovalReason | null;
}

const WRITER_AGENT_TYPES = new Set<AgentType>(["LINKEDIN_WRITER", "INSTAGRAM_WRITER", "CAMPAIGN_WRITER"]);

async function reviseContent(
  agentType: AgentType,
  input: RevisionInput<unknown>
): Promise<AgentRunResult<unknown>> {
  if (agentType === "LINKEDIN_WRITER") {
    return linkedInWriterAgent.revise(input as Parameters<typeof linkedInWriterAgent.revise>[0]);
  }
  if (agentType === "INSTAGRAM_WRITER") {
    return instagramWriterAgent.revise(input as Parameters<typeof instagramWriterAgent.revise>[0]);
  }
  if (agentType === "CAMPAIGN_WRITER") {
    return campaignWriterAgent.revise(input as Parameters<typeof campaignWriterAgent.revise>[0]);
  }
  throw new Error(`Agente "${agentType}" não possui um redator com suporte a correção automática.`);
}

function decideWillRevise(judgment: ContentReview, automaticRevisionCount: number, maxAutomaticRevisions: number): boolean {
  return (
    judgment.decision !== "APPROVED" &&
    !judgment.requiresHumanDecision &&
    judgment.canBeAutomaticallyRevised &&
    automaticRevisionCount < maxAutomaticRevisions
  );
}

/**
 * Runs the automatic Reviewer↔writer correction loop for a single content
 * item. Never calls one agent from another directly — the Reviewer and the
 * writer agent are both invoked from here, the sole coordinator, exactly as
 * the Workflow Runner already calls each agent once during initial
 * generation. Every content item is processed independently; nothing here
 * holds a Prisma transaction open across an AI call, and the per-content
 * `status` column acts as a compare-and-swap lock so the same content is
 * never revised twice at once.
 */
export async function processContentReviewCycle(
  content: ContentToReview,
  initialJudgment: ContentReview,
  ctx: CoordinatorContext,
  writerExecutionId: string | null,
  reviewerExecutionId: string
): Promise<ContentReviewCycleResult> {
  const locked = await generatedContentRepository.tryTransitionStatus(content.id, ["DRAFT"], "UNDER_AI_REVIEW");
  if (!locked) {
    console.error(`[review-correction] content ${content.id} was not in DRAFT — skipping (already being processed?).`);
    return {
      contentId: content.id,
      contentTitle: content.title,
      platform: content.platform,
      format: content.format,
      agentType: content.agentType,
      usedFallback: false,
      automaticRevisionCount: 0,
      finalDecision: initialJudgment.decision,
      reachedWaitingApproval: false,
      reason: null,
    };
  }

  const agentLabel = AGENT_META[content.agentType]?.name ?? content.agentType;

  let judgment = initialJudgment;
  let attempt = 0;
  let currentContentData: unknown = content.content;
  let currentVersion = 1;
  let automaticRevisionCount = 0;
  let usedFallbackAny = false;
  const previousReviews: ContentReview[] = [];
  const previousVersions: PreviousContentVersion[] = [
    { versionNumber: 1, contentData: content.content, source: "INITIAL_GENERATION" as ContentVersionSource },
  ];

  while (true) {
    const willRevise = decideWillRevise(judgment, automaticRevisionCount, content.maxAutomaticRevisions);

    const review = await reviewRepository.create({
      projectId: ctx.projectId,
      generatedContentId: content.id,
      platform: content.platform,
      format: content.format,
      overallScore: judgment.overallScore,
      clarityScore: judgment.clarityScore,
      channelFitScore: judgment.channelFitScore,
      brandToneScore: judgment.brandToneScore,
      ctaScore: judgment.ctaScore,
      grammarScore: judgment.grammarScore,
      briefingAlignmentScore: judgment.briefingAlignmentScore,
      factualSafetyScore: judgment.factualSafetyScore,
      problems: judgment.problems,
      suggestions: judgment.suggestions,
      correctionInstructions: judgment.correctionInstructions,
      suggestedRevision: judgment.suggestedRevision,
      decision: judgment.decision,
      reviewedVersion: currentVersion,
      revisionAttempt: attempt,
      triggeredAutomaticRevision: willRevise,
      isFinalAutomaticReview: !willRevise,
      requiresHumanDecision: judgment.requiresHumanDecision,
      canBeAutomaticallyRevised: judgment.canBeAutomaticallyRevised,
    });

    previousReviews.push(judgment);

    if (!willRevise) {
      const limitReached =
        judgment.decision !== "APPROVED" &&
        !judgment.requiresHumanDecision &&
        judgment.canBeAutomaticallyRevised &&
        automaticRevisionCount >= content.maxAutomaticRevisions;

      await generatedContentRepository.updateRevisionState(content.id, {
        latestReviewDecision: judgment.decision,
        revisionLimitReached: limitReached,
        lastReviewId: review.id,
      });
      await generatedContentRepository.tryTransitionStatus(content.id, ["UNDER_AI_REVIEW"], "WAITING_HUMAN_APPROVAL");

      const reason: PendingApprovalReason = limitReached
        ? "revision_limit_reached"
        : judgment.requiresHumanDecision
          ? "requires_human_decision"
          : judgment.decision === "APPROVED"
            ? "approved_by_ai"
            : "cannot_auto_revise";

      await messageRepository.create({
        projectId: ctx.projectId,
        authorType: "AGENT",
        agentType: content.agentType,
        content: limitReached
          ? `"${content.title}" atingiu o limite de ${content.maxAutomaticRevisions} correções automáticas e foi para aprovação humana.`
          : judgment.requiresHumanDecision
            ? `"${content.title}" exige uma decisão humana e foi para aprovação.`
            : judgment.decision === "APPROVED"
              ? `"${content.title}" foi aprovado pelo Revisor e aguarda aprovação humana.`
              : `"${content.title}" não pôde ser corrigido automaticamente e foi para aprovação humana.`,
      });

      return {
        contentId: content.id,
        contentTitle: content.title,
        platform: content.platform,
        format: content.format,
        agentType: content.agentType,
        usedFallback: usedFallbackAny,
        automaticRevisionCount,
        finalDecision: judgment.decision,
        reachedWaitingApproval: true,
        reason,
      };
    }

    // Needs correction — hand it back to the responsible writer, never to another agent.
    const lockedForRevision = await generatedContentRepository.tryTransitionStatus(content.id, ["UNDER_AI_REVIEW"], "AI_REVISING");
    if (!lockedForRevision) {
      console.error(`[review-correction] content ${content.id} could not be locked for revision (concurrent run?).`);
      return {
        contentId: content.id,
        contentTitle: content.title,
        platform: content.platform,
        format: content.format,
        agentType: content.agentType,
        usedFallback: usedFallbackAny,
        automaticRevisionCount,
        finalDecision: judgment.decision,
        reachedWaitingApproval: false,
        reason: null,
      };
    }

    const nextAttempt = automaticRevisionCount + 1;
    if (writerExecutionId) {
      await agentExecutionRepository.update(writerExecutionId, {
        status: "WORKING",
        currentMessage: `Corrigindo "${content.title}" (tentativa ${nextAttempt} de ${content.maxAutomaticRevisions})`,
      });
    }
    await messageRepository.create({
      projectId: ctx.projectId,
      authorType: "AGENT",
      agentType: content.agentType,
      content: `${agentLabel} — corrigindo "${content.title}" (tentativa ${nextAttempt} de ${content.maxAutomaticRevisions}).`,
    });

    const revisionResult = await reviseContent(content.agentType, {
      projectId: ctx.projectId,
      originalRequest: ctx.originalRequest,
      companyContext: ctx.company,
      editorialPlan: ctx.plan,
      platform: content.platform,
      format: content.format,
      originalContent: currentContentData,
      currentVersion,
      review: judgment,
      previousReviews,
      previousVersions,
      revisionAttempt: nextAttempt,
      maxAutomaticRevisions: content.maxAutomaticRevisions,
    });

    usedFallbackAny = usedFallbackAny || revisionResult.usedFallback;
    currentContentData = revisionResult.data;
    currentVersion += 1;
    automaticRevisionCount = nextAttempt;

    await generatedContentVersionRepository.create({
      generatedContentId: content.id,
      versionNumber: currentVersion,
      contentData: currentContentData as Prisma.InputJsonValue,
      source: "AUTOMATIC_REVISION",
      createdByAgent: content.agentType,
      revisionAttempt: automaticRevisionCount,
      reviewId: review.id,
      changeReason: judgment.problems.join("; ") || null,
      usedFallback: revisionResult.usedFallback,
    });
    previousVersions.push({ versionNumber: currentVersion, contentData: currentContentData, source: "AUTOMATIC_REVISION" });

    await generatedContentRepository.updateContent(content.id, currentContentData as Prisma.InputJsonValue);
    await generatedContentRepository.updateRevisionState(content.id, {
      currentVersion,
      automaticRevisionCount,
      lastReviewId: review.id,
    });
    await generatedContentRepository.tryTransitionStatus(content.id, ["AI_REVISING"], "UNDER_AI_REVIEW");

    if (reviewerExecutionId) {
      await agentExecutionRepository.update(reviewerExecutionId, {
        status: "WORKING",
        currentMessage: `Revisando novamente "${content.title}" (versão ${currentVersion})`,
      });
    }

    const reReview = await reviewerAgent.execute({
      originalRequest: ctx.originalRequest,
      company: ctx.company,
      contents: [
        {
          id: content.id,
          platform: content.platform,
          format: content.format,
          title: content.title,
          contentText: buildContentCopyText(content.format, currentContentData),
          previousReview: {
            attempt: automaticRevisionCount,
            problems: judgment.problems,
            suggestions: judgment.suggestions,
          },
        },
      ],
    });
    usedFallbackAny = usedFallbackAny || reReview.usedFallback;
    const nextJudgment = reReview.data.reviews[0];
    if (!nextJudgment) {
      console.error(`[review-correction] re-review for content ${content.id} returned no result — sending to human review.`);
      await generatedContentRepository.updateRevisionState(content.id, {
        latestReviewDecision: judgment.decision,
        revisionLimitReached: false,
        lastReviewId: review.id,
      });
      await generatedContentRepository.tryTransitionStatus(content.id, ["UNDER_AI_REVIEW"], "WAITING_HUMAN_APPROVAL");
      return {
        contentId: content.id,
        contentTitle: content.title,
        platform: content.platform,
        format: content.format,
        agentType: content.agentType,
        usedFallback: usedFallbackAny,
        automaticRevisionCount,
        finalDecision: judgment.decision,
        reachedWaitingApproval: true,
        reason: "requires_human_decision",
      };
    }
    judgment = nextJudgment;
    attempt = automaticRevisionCount;
  }
}

export interface ManualRevisionResult {
  contentId: string;
  usedFallback: boolean;
  newVersion: number;
}

const HUMAN_ACTIONABLE_STATUSES = ["WAITING_HUMAN_APPROVAL", "APPROVED", "NEEDS_ADJUSTMENT", "REJECTED"] as const;

/**
 * Human-triggered counterpart to the automatic cycle above (Phase 3): a person
 * writes instructions and asks the responsible writer for one more pass.
 * Reuses the exact same `revise()` per agent (retry/timeout/fallback via
 * agent-runner), but — unlike the automatic loop — does not consult the
 * Reviewer again, does not count against `automaticRevisionCount`/
 * `maxAutomaticRevisions`, and never creates a `Review` row (that column
 * represents the AI reviewer's judgment, not a human instruction). The new
 * version is tagged `HUMAN_REQUESTED_REVISION` so it's never confused with an
 * automatic correction in the history UI.
 */
export async function requestManualRevision(
  contentId: string,
  instructions: string,
  ctx: CoordinatorContext
): Promise<ManualRevisionResult> {
  const content = await generatedContentRepository.findById(contentId);
  if (!content) throw new Error("Conteúdo não encontrado.");

  const agentType = content.agentExecution.agentType as AgentType;
  if (!WRITER_AGENT_TYPES.has(agentType)) {
    throw new Error(`"${content.title}" não foi gerado por um redator e não pode ser devolvido para correção.`);
  }

  const locked = await generatedContentRepository.tryTransitionStatus(contentId, [...HUMAN_ACTIONABLE_STATUSES], "AI_REVISING");
  if (!locked) {
    throw new Error(`"${content.title}" já está sendo processado — tente novamente em instantes.`);
  }

  try {
    const previousVersions: PreviousContentVersion[] = content.versions.map((v) => ({
      versionNumber: v.versionNumber,
      contentData: v.contentData,
      source: v.source as ContentVersionSource,
    }));
    const previousReviews: ContentReview[] = content.reviews.map((r) => ({
      generatedContentId: r.generatedContentId ?? content.id,
      platform: r.platform ?? content.platform,
      format: r.format ?? content.format,
      overallScore: r.overallScore,
      clarityScore: r.clarityScore,
      channelFitScore: r.channelFitScore,
      brandToneScore: r.brandToneScore,
      ctaScore: r.ctaScore,
      grammarScore: r.grammarScore ?? 0,
      briefingAlignmentScore: r.briefingAlignmentScore ?? 0,
      factualSafetyScore: r.factualSafetyScore ?? 0,
      problems: r.problems as string[],
      suggestions: r.suggestions as string[],
      correctionInstructions: (r.correctionInstructions as string[] | null) ?? [],
      suggestedRevision: r.suggestedRevision,
      decision: r.decision as ReviewDecision,
      requiresHumanDecision: r.requiresHumanDecision,
      canBeAutomaticallyRevised: r.canBeAutomaticallyRevised,
    }));

    const humanReview: ContentReview = {
      generatedContentId: contentId,
      platform: content.platform,
      format: content.format,
      overallScore: 0,
      clarityScore: 0,
      channelFitScore: 0,
      brandToneScore: 0,
      ctaScore: 0,
      grammarScore: 0,
      briefingAlignmentScore: 0,
      factualSafetyScore: 0,
      problems: [instructions],
      suggestions: [],
      correctionInstructions: [instructions],
      suggestedRevision: null,
      decision: "NEEDS_ADJUSTMENT",
      requiresHumanDecision: false,
      canBeAutomaticallyRevised: true,
    };

    const revisionResult = await reviseContent(agentType, {
      projectId: ctx.projectId,
      originalRequest: ctx.originalRequest,
      companyContext: ctx.company,
      editorialPlan: ctx.plan,
      platform: content.platform as Platform,
      format: content.format as ContentFormat,
      originalContent: content.content,
      currentVersion: content.currentVersion,
      review: humanReview,
      previousReviews,
      previousVersions,
      revisionAttempt: content.automaticRevisionCount,
      maxAutomaticRevisions: content.maxAutomaticRevisions,
    });

    const newVersion = content.currentVersion + 1;
    await generatedContentVersionRepository.create({
      generatedContentId: contentId,
      versionNumber: newVersion,
      contentData: revisionResult.data as Prisma.InputJsonValue,
      source: "HUMAN_REQUESTED_REVISION",
      createdByAgent: agentType,
      changeReason: instructions,
      usedFallback: revisionResult.usedFallback,
    });
    await generatedContentRepository.updateContent(contentId, revisionResult.data as Prisma.InputJsonValue);
    await generatedContentRepository.updateRevisionState(contentId, { currentVersion: newVersion });
    await generatedContentRepository.tryTransitionStatus(contentId, ["AI_REVISING"], "WAITING_HUMAN_APPROVAL");

    const agentLabel = AGENT_META[agentType]?.name ?? agentType;
    await messageRepository.create({
      projectId: ctx.projectId,
      authorType: "AGENT",
      agentType,
      content: `${agentLabel} — "${content.title}" corrigido a pedido humano (versão ${newVersion}).`,
    });

    await notifyPendingApproval({
      projectId: ctx.projectId,
      projectTitle: ctx.projectTitle,
      items: [
        {
          contentId,
          contentTitle: content.title,
          platform: content.platform,
          format: content.format,
          reason: "manual_revision",
        },
      ],
    });

    return { contentId, usedFallback: revisionResult.usedFallback, newVersion };
  } catch (error) {
    // Never leave the content stuck in AI_REVISING if the writer call fails.
    await generatedContentRepository.tryTransitionStatus(contentId, ["AI_REVISING"], "WAITING_HUMAN_APPROVAL");
    throw error;
  }
}

export const reviewCorrectionCoordinator = {
  processContentReviewCycle,
  requestManualRevision,
  isRevisableAgent: (agentType: AgentType) => WRITER_AGENT_TYPES.has(agentType),
};
