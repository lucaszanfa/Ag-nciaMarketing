import { redirect } from "next/navigation";
import { CompareProvidersForm } from "@/components/admin/compare-providers-form";
import { getCurrentUser } from "@/lib/auth";

export default async function CompareProvidersPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparar provedores de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Roda o mesmo pedido no planejamento do Editor-chefe usando Gemini e LM Studio ao mesmo
          tempo, lado a lado — sem precisar trocar o AI_PROVIDER no .env e reiniciar o servidor
          pra testar cada um.
        </p>
      </div>
      <CompareProvidersForm />
    </div>
  );
}
