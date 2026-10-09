import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { UserRole } from "@/types/enums";

/**
 * The logged-in user for this request, or null when there's no valid session
 * or the account is no longer APPROVED (e.g. an admin revoked it after the
 * cookie was issued). Cached per request — safe to call from multiple
 * components/actions without hitting the DB more than once.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "APPROVED") return null;

  return user;
});

/**
 * Attribution for content created by automations (n8n) that call the app's
 * API routes directly — there's no browser session in that case. Automations
 * act as the instance's admin; every install always has exactly one.
 */
export async function getSystemUser() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "APPROVED" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("Nenhum administrador aprovado encontrado para atribuir esta automação.");
  return admin;
}

/** ADMIN implicitly has every CEO permission on top of its own (see src/types/enums.ts). */
function roleSatisfies(role: UserRole, allowed: UserRole[]): boolean {
  if (allowed.includes(role)) return true;
  return role === "ADMIN" && allowed.includes("CEO");
}

/**
 * Guard for Server Actions/Route Handlers: throws when there's no logged-in
 * user or their role isn't one of `allowed`. Callers let the exception
 * propagate — Next.js renders it as a generic error, which is fine since
 * these are only reachable through UI that already hides the action for
 * unauthorized roles (this is the actual enforcement, not just UX).
 */
export async function requireRole(...allowed: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !roleSatisfies(user.role as UserRole, allowed)) {
    throw new Error("Você não tem permissão para fazer isso.");
  }
  return user;
}
