"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SuggestionChips } from "@/components/home/suggestion-chips";
import { createProject } from "@/server/actions/project.actions";
import { Loader2, Sparkles } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {pending ? "Iniciando projeto..." : "Iniciar projeto"}
    </Button>
  );
}

export function InboxForm() {
  const [state, formAction] = useActionState(createProject, null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSuggestion(text: string) {
    if (textareaRef.current) {
      textareaRef.current.value = text;
      textareaRef.current.focus();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
      <form action={formAction} className="w-full">
        <div className="rounded-2xl border border-border bg-background p-3 shadow-sm">
          <Textarea
            ref={textareaRef}
            name="originalRequest"
            placeholder="Ex: Quero uma campanha para divulgar nosso novo serviço durante o próximo mês..."
            className="min-h-32 resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between px-1 pt-2">
            <p className="text-xs text-muted-foreground">
              Descreva o que você precisa; nossa equipe de IA cuida do resto.
            </p>
            <SubmitButton />
          </div>
        </div>
        {state?.error && <p className="mt-2 text-center text-sm text-destructive">{state.error}</p>}
      </form>

      <SuggestionChips onSelect={handleSuggestion} />
    </div>
  );
}
