import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_META } from "@/lib/agent-meta";
import { formatDateTime } from "@/lib/format";
import type { ProjectMessageDetail } from "@/types/project";
import type { AgentType } from "@/types/enums";

const AUTHOR_LABEL: Record<ProjectMessageDetail["authorType"], string> = {
  CEO: "CEO",
  AGENT: "Agente",
  SYSTEM: "Sistema",
  USER: "Usuário",
};

export function MessageHistory({ messages }: { messages: ProjectMessageDetail[] }) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((message) => {
          const agentLabel = message.agentType
            ? AGENT_META[message.agentType as AgentType].name
            : AUTHOR_LABEL[message.authorType];
          return (
            <div key={message.id} className="flex flex-col gap-0.5 border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{agentLabel}</span>
                <span>{formatDateTime(message.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{message.content}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
