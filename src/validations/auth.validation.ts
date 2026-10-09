import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa ter pelo menos 2 caracteres."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
