import type { SerializedProjectDetail } from "@/types/project";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildProjectExportJson(project: SerializedProjectDetail): string {
  return JSON.stringify(
    {
      title: project.title,
      originalRequest: project.originalRequest,
      status: project.status,
      createdAt: project.createdAt,
      completedAt: project.completedAt,
      contents: project.generatedContents.map((c) => ({
        platform: c.platform,
        format: c.format,
        title: c.title,
        content: c.content,
        status: c.status,
        currentVersion: c.currentVersion,
        automaticRevisionCount: c.automaticRevisionCount,
        maxAutomaticRevisions: c.maxAutomaticRevisions,
        revisionLimitReached: c.revisionLimitReached,
        latestReviewDecision: c.latestReviewDecision,
        versions: c.versions.map((v) => ({
          versionNumber: v.versionNumber,
          source: v.source,
          revisionAttempt: v.revisionAttempt,
          usedFallback: v.usedFallback,
          changeReason: v.changeReason,
          createdAt: v.createdAt,
        })),
        reviews: c.reviews.map((r) => ({
          revisionAttempt: r.revisionAttempt,
          reviewedVersion: r.reviewedVersion,
          decision: r.decision,
          overallScore: r.overallScore,
          requiresHumanDecision: r.requiresHumanDecision,
          createdAt: r.createdAt,
        })),
        comments: c.comments.map((cm) => ({
          authorName: cm.authorName,
          content: cm.content,
          createdAt: cm.createdAt,
        })),
      })),
    },
    null,
    2
  );
}

export function buildProjectExportMarkdown(project: SerializedProjectDetail, plan: ChiefEditorPlan | null): string {
  const lines: string[] = [];
  lines.push(`# ${project.title}`, "");
  lines.push(`**Solicitação original:** ${project.originalRequest}`, "");

  if (plan) {
    lines.push("## Planejamento", "");
    lines.push(`- Objetivo: ${plan.objective}`);
    lines.push(`- Público-alvo: ${plan.targetAudience}`);
    lines.push(`- Tom: ${plan.tone}`);
    lines.push(`- Mensagem principal: ${plan.mainMessage}`);
    lines.push(`- CTA: ${plan.primaryCta}`, "");
  }

  for (const content of project.generatedContents) {
    lines.push(`## ${content.title} (${content.platform} · ${content.format})`, "");
    lines.push(`- Status: ${content.status} · Versão ${content.currentVersion}`);
    if (content.automaticRevisionCount > 0) {
      lines.push(
        `- Correções automáticas: ${content.automaticRevisionCount}/${content.maxAutomaticRevisions}${content.revisionLimitReached ? " (limite atingido)" : ""}`
      );
    }
    if (content.latestReviewDecision) {
      lines.push(`- Última decisão do Revisor: ${content.latestReviewDecision}`);
    }
    lines.push("");
    lines.push("```json", JSON.stringify(content.content, null, 2), "```", "");

    if (content.comments.length > 0) {
      lines.push("**Comentários:**", "");
      for (const comment of content.comments) {
        lines.push(`- _${comment.authorName}_: ${comment.content}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
