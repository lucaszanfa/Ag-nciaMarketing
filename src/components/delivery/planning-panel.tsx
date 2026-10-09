import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platformLabel, contentFormatLabel } from "@/lib/content-labels";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

export function PlanningPanel({ plan }: { plan: ChiefEditorPlan | null }) {
  if (!plan) {
    return <p className="text-sm text-muted-foreground">Planejamento ainda não disponível.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{plan.projectTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{plan.summary}</p>
          <p><span className="font-medium">Objetivo: </span>{plan.objective}</p>
          <p><span className="font-medium">Público-alvo: </span>{plan.targetAudience}</p>
          <p><span className="font-medium">Tom: </span>{plan.tone}</p>
          <p><span className="font-medium">Mensagem principal: </span>{plan.mainMessage}</p>
          <p><span className="font-medium">CTA: </span>{plan.primaryCta}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano de conteúdo ({plan.contentPlan.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.contentPlan.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.theme}</p>
                <div className="flex gap-1.5">
                  <Badge variant="outline">{platformLabel(item.platform)}</Badge>
                  <Badge variant="outline">{contentFormatLabel(item.format)}</Badge>
                </div>
              </div>
              <p className="mt-1 text-muted-foreground">{item.objective}</p>
              <p className="mt-2">{item.briefing}</p>
              <p className="mt-2 text-xs text-muted-foreground">Data sugerida: {item.suggestedDate}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
