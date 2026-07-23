import { AGENT_META, AGENT_ORDER } from "@/lib/agent-meta";
import { AgentCard } from "./agent-card";
import type { AgentExecutionDetail, SerializedProjectDetail } from "@/types/project";
import type { ReviewerOutput } from "@/services/ai/schemas";
import type { ChiefEditorPlan } from "@/services/ai/schemas/chief-editor.schema";

function CeoSummary({ project }: { project: SerializedProjectDetail }) {
  return <p className="line-clamp-3 text-xs text-muted-foreground">“{project.originalRequest}”</p>;
}

function ChiefEditorSummary({ execution }: { execution: AgentExecutionDetail }) {
  const output = execution.output as unknown as ChiefEditorPlan | null;
  if (!output) return null;
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <p className="text-foreground">{output.objective}</p>
      <p>{output.contentPlan.length} itens planejados · tom {output.tone.toLowerCase()}</p>
    </div>
  );
}

function WriterSummary({ project, agentExecutionId }: { project: SerializedProjectDetail; agentExecutionId: string }) {
  const ownContents = project.generatedContents.filter((c) => c.agentExecutionId === agentExecutionId);
  const totalRevisions = ownContents.reduce((sum, c) => sum + c.automaticRevisionCount, 0);
  const limitReachedCount = ownContents.filter((c) => c.revisionLimitReached).length;
  return (
    <p className="text-xs text-muted-foreground">
      {ownContents.length} conteúdo(s) criado(s)
      {totalRevisions > 0 && ` · ${totalRevisions} correção(ões) automática(s)`}
      {limitReachedCount > 0 && ` · ${limitReachedCount} no limite`}
    </p>
  );
}

function ReviewerSummary({ execution }: { execution: AgentExecutionDetail }) {
  const output = execution.output as unknown as ReviewerOutput | null;
  if (!output) return null;
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <p className="text-foreground">Nota geral: {output.overallProjectScore}</p>
      <p className="line-clamp-2">{output.summary}</p>
    </div>
  );
}

export function AgentFlow({ project }: { project: SerializedProjectDetail }) {
  const executionsByType = new Map(project.agentExecutions.map((e) => [e.agentType, e]));

  return (
    <div className="flex flex-col gap-4">
      {AGENT_ORDER.map((type) => {
        const meta = AGENT_META[type];
        const execution = executionsByType.get(type) ?? null;

        let summary: React.ReactNode = null;
        if (type === "CEO") summary = <CeoSummary project={project} />;
        else if (type === "CHIEF_EDITOR" && execution) summary = <ChiefEditorSummary execution={execution} />;
        else if (
          (type === "LINKEDIN_WRITER" || type === "INSTAGRAM_WRITER" || type === "CAMPAIGN_WRITER") &&
          execution
        )
          summary = <WriterSummary project={project} agentExecutionId={execution.id} />;
        else if (type === "REVIEWER" && execution) summary = <ReviewerSummary execution={execution} />;

        return <AgentCard key={type} meta={meta} execution={execution} summary={summary} />;
      })}
    </div>
  );
}
