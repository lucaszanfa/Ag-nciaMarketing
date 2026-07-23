import Link from "next/link";
import { History } from "lucide-react";
import { messageRepository } from "@/server/repositories/message.repository";
import { AGENT_META } from "@/lib/agent-meta";
import { formatDateTime } from "@/lib/format";
import type { AgentType } from "@/types/enums";

const AUTHOR_LABEL: Record<string, string> = {
  CEO: "CEO",
  AGENT: "Agente",
  SYSTEM: "Sistema",
  USER: "Usuário",
};

export default async function HistoryPage() {
  const messages = await messageRepository.listAll();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Histórico</h1>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <History className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const label = message.agentType
              ? AGENT_META[message.agentType as AgentType].name
              : AUTHOR_LABEL[message.authorType];
            return (
              <div key={message.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Link href={`/projetos/${message.project.id}`} className="font-medium text-foreground hover:underline">
                    {message.project.title}
                  </Link>
                  <span>{formatDateTime(message.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{label}: </span>
                  {message.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
