"use server";

import { revalidatePath } from "next/cache";
import { settingsRepository } from "@/server/repositories/settings.repository";
import { updateSettingsSchema } from "@/validations/settings.validation";

export async function updateSettings(input: unknown) {
  const parsed = updateSettingsSchema.parse(input);
  await settingsRepository.update(parsed);
  revalidatePath("/configuracoes");
}
