"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlanningPanel } from "./planning-panel";
import { ContentOverviewPanel } from "./content-overview-panel";
import { LinkedInPanel } from "./linkedin-panel";
import { InstagramPanel } from "./instagram-panel";
import { CampaignPanel } from "./campaign-panel";
import { ReviewPanel } from "./review-panel";
import { SummaryPanel } from "./summary-panel";
import { approveAllContent, rejectAllContent } from "@/server/actions/content.actions";
import { toast } from "sonner";
import type { SerializedProjectDetail } from "@/types/project";
import type { ReviewerOutput } from "@/services/ai/schemas";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

function BulkActionsToolbar({ projectId, waitingCount }: { projectId: string; waitingCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  if (waitingCount === 0) return null;

  function handleConfirm() {
    const action = confirmAction;
    startTransition(async () => {
      if (action === "approve") {
        await approveAllContent(projectId);
        toast.success("Todos os conteúdos pendentes foram aprovados.");
      } else if (action === "reject") {
        await rejectAllContent(projectId);
        toast.success("Todos os conteúdos pendentes foram rejeitados.");
      }
      setConfirmAction(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{waitingCount} aguardando aprovação</span>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setConfirmAction("approve")}>
          <ThumbsUp className="size-3.5" />
          Aprovar todos
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setConfirmAction("reject")}>
          <ThumbsDown className="size-3.5" />
          Rejeitar todos
        </Button>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Aprovar todos os conteúdos pendentes?" : "Rejeitar todos os conteúdos pendentes?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai {confirmAction === "approve" ? "aprovar" : "rejeitar"} de uma vez os {waitingCount} conteúdo(s)
              ainda aguardando aprovação neste projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DeliveryTabs({
  project,
  company,
}: {
  project: SerializedProjectDetail;
  company: { name: string; logoUrl: string | null };
}) {
  const chiefEditorExecution = project.agentExecutions.find((e) => e.agentType === "CHIEF_EDITOR");
  const reviewerExecution = project.agentExecutions.find((e) => e.agentType === "REVIEWER");

  const plan = (chiefEditorExecution?.output as unknown as ChiefEditorPlan | null) ?? null;
  const reviewerSummary = (reviewerExecution?.output as unknown as ReviewerOutput | null) ?? null;

  const isBriefing = (agentExecutionId: string) => agentExecutionId === chiefEditorExecution?.id;
  // DRAFT means the content never made it into the review pipeline (e.g. a
  // stuck/duplicate generation) — it's not a real deliverable, so it's noise
  // in the delivery view. Content actually awaiting a decision is
  // WAITING_HUMAN_APPROVAL, not DRAFT, and keeps showing with its actions.
  const isDeliverable = (c: { status: string }) => c.status !== "DRAFT";

  const linkedinContents = project.generatedContents.filter(
    (c) => c.platform === "LINKEDIN" && !isBriefing(c.agentExecutionId) && isDeliverable(c)
  );
  const instagramContents = project.generatedContents.filter(
    (c) => c.platform === "INSTAGRAM" && !isBriefing(c.agentExecutionId) && isDeliverable(c)
  );
  const campaignContent =
    project.generatedContents.find(
      (c) => c.format === "CAMPAIGN_PLAN" && !isBriefing(c.agentExecutionId) && isDeliverable(c)
    ) ?? null;
  const waitingCount = project.generatedContents.filter((c) => c.status === "WAITING_HUMAN_APPROVAL").length;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Entrega final</CardTitle>
        <BulkActionsToolbar projectId={project.id} waitingCount={waitingCount} />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resultado">
          <TabsList className="flex-wrap">
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="campanha">Campanha</TabsTrigger>
            <TabsTrigger value="revisao">Revisão</TabsTrigger>
            <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
            <TabsTrigger value="resumo">Resumo final</TabsTrigger>
          </TabsList>

          <TabsContent value="resultado" className="pt-4">
            <ContentOverviewPanel
              linkedinContents={linkedinContents}
              instagramContents={instagramContents}
              campaignContent={campaignContent}
              company={company}
            />
          </TabsContent>
          <TabsContent value="planejamento" className="pt-4">
            <PlanningPanel plan={plan} />
          </TabsContent>
          <TabsContent value="linkedin" className="pt-4">
            <LinkedInPanel contents={linkedinContents} company={company} />
          </TabsContent>
          <TabsContent value="instagram" className="pt-4">
            <InstagramPanel contents={instagramContents} company={company} />
          </TabsContent>
          <TabsContent value="campanha" className="pt-4">
            <CampaignPanel content={campaignContent} />
          </TabsContent>
          <TabsContent value="revisao" className="pt-4">
            <ReviewPanel contents={project.generatedContents} reviewerSummary={reviewerSummary} />
          </TabsContent>
          <TabsContent value="resumo" className="pt-4">
            <SummaryPanel project={project} plan={plan} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
