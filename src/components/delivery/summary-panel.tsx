"use client";

import Link from "next/link";
import { FileJson, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { buildProjectExportJson, buildProjectExportMarkdown, downloadFile } from "@/lib/export";
import type { SerializedProjectDetail } from "@/types/project";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

export function SummaryPanel({
  project,
  plan,
}: {
  project: SerializedProjectDetail;
  plan: ChiefEditorPlan | null;
}) {
  function exportJson() {
    downloadFile(`${project.id}.json`, buildProjectExportJson(project), "application/json");
  }

  function exportMarkdown() {
    downloadFile(`${project.id}.md`, buildProjectExportMarkdown(project, plan), "text/markdown");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Conteúdos</p>
            <p className="text-lg font-semibold">{project.generatedContents.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Criado em</p>
            <p className="font-medium">{formatDateTime(project.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Concluído em</p>
            <p className="font-medium">{formatDateTime(project.completedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">{project.status}</p>
          </div>
        </div>

        {plan && <p className="text-muted-foreground">{plan.objective}</p>}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJson}>
            <FileJson className="size-3.5" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportMarkdown}>
            <FileText className="size-3.5" />
            Exportar Markdown
          </Button>
          <Button render={<Link href="/" />} nativeButton={false} size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Criar novo projeto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
