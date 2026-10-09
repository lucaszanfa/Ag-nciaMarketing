"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveUser, rejectUser } from "@/server/actions/admin.actions";
import { formatDateTime } from "@/lib/format";

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function PendingUsersList({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(action: (id: string) => Promise<void>, id: string, successMessage: string) {
    startTransition(async () => {
      try {
        await action(id);
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum cadastro pendente.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
        >
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.email} · cadastrado em {formatDateTime(user.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => handle(approveUser, user.id, "Usuário aprovado.")}
            >
              <Check className="size-4" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => handle(rejectUser, user.id, "Cadastro rejeitado.")}
            >
              <X className="size-4" />
              Rejeitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
