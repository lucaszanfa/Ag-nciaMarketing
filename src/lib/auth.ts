import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@marketingaistudio.local";

/**
 * Simulated auth for this single-tenant MVP: always returns the seeded admin
 * user (auto-provisioning it if missing). No sessions, no login screen.
 *
 * TODO(real-auth): replace with a real session lookup (e.g. NextAuth/Lucia)
 * once multi-user access is needed. Every call site already treats this as
 * async, so swapping the implementation won't require touching callers.
 */
export async function getCurrentUser() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      name: "Administrador",
      email: ADMIN_EMAIL,
      role: "CEO / Responsável de Marketing",
    },
  });
}
