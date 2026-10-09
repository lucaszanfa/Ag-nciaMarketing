"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/types/enums";

const ASSIGNABLE_ROLES: UserRole[] = ["COMMON", "CEO", "ADMIN"];

export async function approveUser(userId: string) {
  await requireRole("ADMIN");
  await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  revalidatePath("/admin");
}

export async function rejectUser(userId: string) {
  await requireRole("ADMIN");
  await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
}

export async function changeUserRole(userId: string, role: UserRole) {
  const actingUser = await requireRole("ADMIN");
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Papel inválido.");
  }
  if (userId === actingUser.id && role !== "ADMIN") {
    throw new Error("Você não pode remover seu próprio acesso de administrador.");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}
