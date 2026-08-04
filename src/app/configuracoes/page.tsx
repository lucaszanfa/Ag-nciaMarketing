import { settingsRepository } from "@/server/repositories/settings.repository";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";

export default async function SettingsPage() {
  const settings = await settingsRepository.get();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações da empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essas informações orientam os agentes de IA ao gerar conteúdo para a sua empresa.
        </p>
      </div>
      <CompanySettingsForm settings={settings} />
    </div>
  );
}
