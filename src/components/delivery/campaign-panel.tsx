import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentActions } from "./content-actions";
import { VersionInfo } from "./version-info";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type { CampaignWriterOutput } from "@/services/ai/schemas";
import type { ContentStatus } from "@/types/enums";

export function CampaignPanel({ content }: { content: GeneratedContentDetail | null }) {
  if (!content) {
    return <p className="text-sm text-muted-foreground">Campanha ainda não disponível.</p>;
  }

  const campaign = content.content as unknown as CampaignWriterOutput;

  if (campaign.required === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campanha</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Nenhuma campanha institucional foi considerada necessária para esta solicitação.</p>
          {campaign.writerInstructions?.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {campaign.writerInstructions.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  const copyText = [
    campaign.name,
    campaign.concept,
    "",
    `Objetivo: ${campaign.objective}`,
    `Mensagem principal: ${campaign.mainMessage}`,
    "",
    ...campaign.phases.map((p) => `${p.name} (${p.durationWeeks} sem.): ${p.description}`),
    "",
    `CTA: ${campaign.cta}`,
  ].join("\n");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{campaign.name}</CardTitle>
          <VersionInfo item={content} />
        </div>
        <ContentStatusBadge status={content.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{campaign.concept}</p>
        {campaign.slogan && <p className="italic">"{campaign.slogan}"</p>}
        <p><span className="font-medium">Objetivo: </span>{campaign.objective}</p>
        <p><span className="font-medium">Mensagem principal: </span>{campaign.mainMessage}</p>
        <p><span className="font-medium">Público: </span>{campaign.targetAudience}</p>
        <p><span className="font-medium">Duração: </span>{campaign.durationWeeks} semana(s)</p>

        <div>
          <p className="font-medium">Fases:</p>
          <div className="mt-1.5 space-y-1.5">
            {campaign.phases.map((phase) => (
              <div key={phase.name} className="rounded-lg border border-border p-2.5">
                <p className="font-medium">{phase.name} <span className="font-normal text-muted-foreground">({phase.durationWeeks} sem.)</span></p>
                <p className="text-muted-foreground">{phase.description}</p>
                {phase.actions?.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {phase.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {campaign.channels.map((channel) => (
            <Badge key={channel} variant="outline">{channel}</Badge>
          ))}
        </div>

        <p className="font-medium">{campaign.cta}</p>

        <div>
          <p className="font-medium">Ideias de peças:</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {campaign.pieceIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </div>

        {campaign.schedule?.length > 0 && (
          <div>
            <p className="font-medium">Cronograma:</p>
            <div className="mt-1.5 space-y-1 text-muted-foreground">
              {campaign.schedule.map((item, i) => (
                <p key={i}>{item.period} · {item.channel}: {item.action}</p>
              ))}
            </div>
          </div>
        )}

        {campaign.recommendedMetrics?.length > 0 && (
          <div>
            <p className="font-medium">Indicadores recomendados:</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {campaign.recommendedMetrics.map((metric) => (
                <Badge key={metric} variant="outline">{metric}</Badge>
              ))}
            </div>
          </div>
        )}

        {campaign.risks?.length > 0 && (
          <div>
            <p className="font-medium">Riscos:</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {campaign.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {campaign.writerInstructions?.length > 0 && (
          <div>
            <p className="font-medium">Observações para os redatores:</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {campaign.writerInstructions.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <ContentActions
          contentId={content.id}
          copyText={copyText}
          rawContent={campaign}
          status={content.status as ContentStatus}
          scheduledAt={content.scheduledAt}
          versions={content.versions}
          comments={content.comments}
        />
      </CardContent>
    </Card>
  );
}
