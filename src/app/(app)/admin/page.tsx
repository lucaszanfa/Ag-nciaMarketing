import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PendingUsersList } from "@/components/admin/pending-users-list";
import { UserRoleList } from "@/components/admin/user-role-list";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/");

  // Never send `password` (even the hash) to the client.
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });
  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprove novos cadastros e gerencie o nível de acesso de cada pessoa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendentes de aprovação ({pending.length})</CardTitle>
          <CardDescription>Ninguém consegue entrar até você aprovar o cadastro.</CardDescription>
        </CardHeader>
        <CardContent>
          <PendingUsersList users={pending} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos os usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleList users={others} currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
