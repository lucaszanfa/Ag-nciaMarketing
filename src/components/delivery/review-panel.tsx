import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewDecisionBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type { ReviewerOutput } from "@/services/ai/schemas";
import type { ReviewDecision } from "@/types/enums";

function scoreBarClass(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-destructive";
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${scoreBarClass(score)}`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

export function ReviewPanel({
  contents,
  reviewerSummary,
}: {
  contents: GeneratedContentDetail[];
  reviewerSummary: ReviewerOutput | null;
}) {
  return (
    <div className="space-y-4">
      {reviewerSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avaliação geral · {reviewerSummary.overallProjectScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{reviewerSummary.summary}</p>
          </CardContent>
        </Card>
      )}

      {contents.map((item) => {
        const sortedReviews = [...item.reviews].sort((a, b) => a.revisionAttempt - b.revisionAttempt);
        const review = sortedReviews[sortedReviews.length - 1];
        if (!review) return null;
        const earlierReviews = sortedReviews.slice(0, -1);

        return (
          <Card key={item.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                {sortedReviews.length > 1 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tentativa {review.revisionAttempt} · versão {review.reviewedVersion}
                    {item.revisionLimitReached && " · limite de correções atingido"}
                  </p>
                )}
              </div>
              <ReviewDecisionBadge decision={review.decision as ReviewDecision} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <ScoreRow label="Geral" score={review.overallScore} />
                <ScoreRow label="Clareza" score={review.clarityScore} />
                <ScoreRow label="Canal" score={review.channelFitScore} />
                <ScoreRow label="Tom da marca" score={review.brandToneScore} />
                <ScoreRow label="CTA" score={review.ctaScore} />
                {review.grammarScore != null && <ScoreRow label="Gramática" score={review.grammarScore} />}
                {review.briefingAlignmentScore != null && (
                  <ScoreRow label="Aderência ao briefing" score={review.briefingAlignmentScore} />
                )}
                {review.factualSafetyScore != null && (
                  <ScoreRow label="Segurança factual" score={review.factualSafetyScore} />
                )}
              </div>

              {Array.isArray(review.problems) && review.problems.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Pontos de atenção:</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {(review.problems as string[]).map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(review.suggestions) && review.suggestions.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Sugestões:</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {(review.suggestions as string[]).map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(review.correctionInstructions) && review.correctionInstructions.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Instruções de correção:</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {(review.correctionInstructions as string[]).map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.suggestedRevision && (
                <div className="text-sm">
                  <p className="font-medium">Versão sugerida:</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{review.suggestedRevision}</p>
                </div>
              )}

              {review.requiresHumanDecision && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  O Revisor sinalizou que este item exige uma decisão humana.
                </p>
              )}

              {earlierReviews.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Ver revisões anteriores ({earlierReviews.length})
                  </summary>
                  <div className="mt-2 space-y-2 border-l border-border pl-3">
                    {earlierReviews.map((prior) => (
                      <div key={prior.id} className="text-xs">
                        <p>
                          <span className="font-medium">Tentativa {prior.revisionAttempt}</span> · versão{" "}
                          {prior.reviewedVersion} · nota {prior.overallScore} ·{" "}
                          <ReviewDecisionBadge decision={prior.decision as ReviewDecision} />
                        </p>
                        {Array.isArray(prior.problems) && prior.problems.length > 0 && (
                          <p className="text-muted-foreground">{(prior.problems as string[]).join("; ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
