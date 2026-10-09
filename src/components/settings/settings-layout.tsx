"use client";

import { useState } from "react";
import { Building2, Users2, ShieldCheck, Palette, KeyRound, type LucideIcon } from "lucide-react";
import { CompanySettingsForm } from "./company-settings-form";
import { ChangePasswordForm } from "./change-password-form";
import { cn } from "@/lib/utils";
import type { CompanySettings } from "@/generated/prisma/client";

const SECTIONS: { id: SettingsSectionId; label: string; icon: LucideIcon }[] = [
  { id: "identidade", label: "Identidade da empresa", icon: Building2 },
  { id: "publico", label: "Público e tom de voz", icon: Users2 },
  { id: "diretrizes", label: "Diretrizes de conteúdo", icon: ShieldCheck },
  { id: "visual", label: "Site, redes e visual", icon: Palette },
  { id: "conta", label: "Sua conta", icon: KeyRound },
];

export type SettingsSectionId = "identidade" | "publico" | "diretrizes" | "visual" | "conta";

export function SettingsLayout({ settings }: { settings: CompanySettings }) {
  const [active, setActive] = useState<SettingsSectionId>("identidade");

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <nav className="flex gap-1 overflow-x-auto pb-1 sm:w-60 sm:shrink-0 sm:flex-col sm:overflow-visible sm:pb-0">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1">
        <div className={active === "conta" ? "hidden" : ""}>
          <CompanySettingsForm settings={settings} activeSection={active} />
        </div>
        {active === "conta" && <ChangePasswordForm />}
      </div>
    </div>
  );
}
