import { Suspense } from "react";
import { Library } from "lucide-react";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { listContentQuerySchema } from "@/validations/content.validation";
import { LibraryToolbar } from "@/components/library/library-toolbar";
import { LibraryContentCard } from "@/components/library/library-content-card";

export default async function LibraryPage(props: PageProps<"/biblioteca">) {
  const rawSearchParams = await props.searchParams;
  const single = (key: string) => {
    const value = rawSearchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const filters = listContentQuerySchema.parse({
    projectId: single("projectId"),
    platform: single("platform"),
    format: single("format"),
    status: single("status"),
    agentType: single("agentType"),
  });

  const [rawContents, projects] = await Promise.all([
    generatedContentRepository.list({
      ...filters,
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
    }),
    projectRepository.list(),
  ]);

  // The Chief Editor's planning "briefings" (objective/briefing/suggestedDate — not a
  // finished post) are only shown when explicitly requested via the agent filter;
  // otherwise the library should only surface ready-to-publish deliverables.
  const contents =
    filters.agentType === "CHIEF_EDITOR"
      ? rawContents
      : rawContents.filter((item) => item.agentExecution.agentType !== "CHIEF_EDITOR");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Biblioteca de conteúdos</h1>

      <Suspense>
        <LibraryToolbar projects={projects.map((p) => ({ id: p.id, title: p.title }))} />
      </Suspense>

      {contents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Library className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contents.map((item) => (
            <LibraryContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
