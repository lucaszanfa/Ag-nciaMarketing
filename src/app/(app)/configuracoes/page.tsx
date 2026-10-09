import { redirect } from "next/navigation";
import { settingsRepository } from "@/server/repositories/settings.repository";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (user?.role === "COMMON") redirect("/");

  const settings = await settingsRepository.get();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essas informações orientam os agentes de IA ao gerar conteúdo para a sua empresa.
        </p>
      </div>
      <SettingsLayout settings={settings} />
    </div>
  );
}
