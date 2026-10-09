import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types/enums";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Defense in depth: `proxy.ts` already redirects unauthenticated requests
  // here, but that's only an optimistic cookie check (see its comment).
  if (!user) redirect("/login");

  const pendingApprovalCount = await generatedContentRepository.countPendingApproval(
    user.role === "COMMON" ? user.id : undefined
  );

  return (
    <AppShell user={{ name: user.name, role: user.role as UserRole }} pendingApprovalCount={pendingApprovalCount}>
      {children}
    </AppShell>
  );
}
