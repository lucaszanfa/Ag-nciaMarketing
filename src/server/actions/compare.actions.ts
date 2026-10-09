"use server";

import { requireRole } from "@/lib/auth";
import { buildCompanyContext } from "@/services/ai/company-context.service";
import { compareGeminiVsLmStudio, type ProviderComparisonResult } from "@/services/ai/compare-providers";

export async function compareProviders(
  originalRequest: string
): Promise<[ProviderComparisonResult, ProviderComparisonResult]> {
  await requireRole("ADMIN");

  if (!originalRequest.trim() || originalRequest.trim().length < 10) {
    throw new Error("Descreva o pedido com pelo menos 10 caracteres.");
  }

  const company = await buildCompanyContext();
  return compareGeminiVsLmStudio({ originalRequest: originalRequest.trim(), company });
}
