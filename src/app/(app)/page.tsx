import { Sparkles } from "lucide-react";
import { ProjectComposer } from "@/components/home/project-composer";
import { buildIdeaTemplates } from "@/components/home/idea-templates";
import { settingsRepository } from "@/server/repositories/settings.repository";

export default async function Home() {
  const settings = await settingsRepository.get();
  const allowedTopics = Array.isArray(settings.allowedTopics) ? (settings.allowedTopics as string[]) : [];
  const ideas = buildIdeaTemplates(allowedTopics);

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-[calc(50%+8rem)] -z-10 h-56 w-96 -translate-x-1/2 -translate-y-1/3 rounded-full bg-chart-2/20 blur-3xl"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg shadow-primary/25">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Novo projeto de conteúdo</h1>
          <p className="max-w-xl text-balance text-muted-foreground">
            Descreva o que quer comunicar e ajuste canais, quantidade e prazo. O editor-chefe planeja, os
            redatores escrevem e o revisor corrige antes de chegar para a sua aprovação.
          </p>
        </div>

        <ProjectComposer ideas={ideas} />
      </div>
    </div>
  );
}
