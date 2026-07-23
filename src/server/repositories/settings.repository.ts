import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Single-tenant app: there is exactly one CompanySettings row. */
export const settingsRepository = {
  async get() {
    const existing = await prisma.companySettings.findFirst();
    if (existing) return existing;
    return prisma.companySettings.create({
      data: {
        companyName: "Minha Empresa",
        products: [],
        services: [],
        objectives: [],
        preferredTerms: [],
        forbiddenTerms: [],
        allowedTopics: [],
        forbiddenTopics: [],
        hashtags: [],
        socialNetworks: {},
        colors: [],
      },
    });
  },

  async update(data: Prisma.CompanySettingsUpdateInput) {
    const existing = await this.get();
    return prisma.companySettings.update({ where: { id: existing.id }, data });
  },
};
