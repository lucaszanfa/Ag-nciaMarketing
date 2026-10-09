"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeUserRole } from "@/server/actions/admin.actions";
import type { UserRole, UserStatus } from "@/types/enums";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "COMMON", label: "Usuário comum" },
  { value: "CEO", label: "CEO / Responsável de Marketing" },
  { value: "ADMIN", label: "Administrador" },
];

const STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export function UserRoleList({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      try {
        await changeUserRole(userId, role as UserRole);
        toast.success("Papel atualizado.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o papel.");
      }
    });
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>;
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
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.status === "REJECTED" ? "destructive" : "outline"}>
              {STATUS_LABEL[user.status as UserStatus] ?? user.status}
            </Badge>
            <Select
              defaultValue={user.role}
              disabled={isPending || user.id === currentUserId}
              onValueChange={(value) => value && handleRoleChange(user.id, value)}
            >
              <SelectTrigger className="w-52">
                <SelectValue>
                  {(value: UserRole) => ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}
