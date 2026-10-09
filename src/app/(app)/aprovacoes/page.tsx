import { Inbox } from "lucide-react";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { LibraryContentCard } from "@/components/library/library-content-card";
import { getCurrentUser } from "@/lib/auth";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  const scopedCreatedById = user?.role === "COMMON" ? user.id : undefined;
  const contents = await generatedContentRepository.listApprovalInbox(scopedCreatedById);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aprovações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {contents.length > 0
            ? `${contents.length} conteúdo(s) aguardando sua decisão, do mais antigo para o mais novo.`
            : "Tudo em dia — nada aguardando aprovação no momento."}
        </p>
      </div>

      {contents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo aguardando aprovação.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contents.map((item) => (
            <LibraryContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
