"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";
import { registerSchema, loginSchema, changePasswordSchema } from "@/validations/auth.validation";
import type { UserRole } from "@/types/enums";

export type AuthFormState = { error: string } | { success: string } | null;

export async function registerUser(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Já existe uma conta com esse e-mail." };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: await hashPassword(parsed.data.password),
      role: "COMMON" satisfies UserRole,
      status: "PENDING",
    },
  });

  return {
    success: "Cadastro enviado! Um administrador precisa aprovar seu acesso antes que você consiga entrar.",
  };
}

export async function loginUser(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return { error: "E-mail ou senha incorretos." };
  }

  if (user.status === "PENDING") {
    return { error: "Seu cadastro ainda está aguardando aprovação de um administrador." };
  }
  if (user.status === "REJECTED") {
    return { error: "Seu acesso a este sistema não foi aprovado." };
  }

  await createSession(user.id, user.role as UserRole);
  redirect("/");
}

export async function logoutUser() {
  await deleteSession();
  redirect("/login");
}

export async function changeOwnPassword(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!(await verifyPassword(parsed.data.currentPassword, user.password))) {
    return { error: "Senha atual incorreta." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(parsed.data.newPassword) },
  });

  return { success: "Senha alterada com sucesso." };
}
