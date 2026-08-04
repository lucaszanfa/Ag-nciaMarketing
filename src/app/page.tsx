import { Sparkles } from "lucide-react";
import { InboxForm } from "@/components/home/inbox-form";

export default function Home() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            O que você gostaria de criar hoje?
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground">
            Descreva sua solicitação e nossa equipe de IA — editor-chefe, redatores e revisor —
            transforma isso em um plano de conteúdo completo, pronto para publicar.
          </p>
        </div>

        <InboxForm />
      </div>
    </div>
  );
}
