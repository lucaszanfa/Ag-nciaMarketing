"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Briefcase, CalendarDays, Camera, Clock, Hash, Lightbulb, Loader2, Megaphone, Sparkles, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createProject } from "@/server/actions/project.actions";
import {
  CHANNEL_LABELS,
  OBJECTIVE_LABELS,
  PERIOD_LABELS,
  REQUEST_OBJECTIVES,
  REQUEST_PERIODS,
  type RequestChannel,
  type RequestObjective,
  type RequestPeriod,
} from "@/lib/project-request";
import type { IdeaTemplate } from "./idea-templates";

const CHANNEL_ICONS: Record<RequestChannel, ReactNode> = {
  LINKEDIN: <Briefcase className="size-3.5" />,
  INSTAGRAM: <Camera className="size-3.5" />,
  CAMPAIGN: <Megaphone className="size-3.5" />,
};
const QUANTITIES = [1, 2, 3, 5] as const;

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function OptionRow({ icon, label, hint, children }: { icon: ReactNode; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex w-32 shrink-0 items-center gap-1.5 pt-1 text-xs font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1.5">{children}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="gap-2" disabled={pending || disabled}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {pending ? "Criando projeto..." : "Criar projeto"}
    </Button>
  );
}

export function ProjectComposer({ ideas }: { ideas: IdeaTemplate[] }) {
  const [state, formAction] = useActionState(createProject, null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Controlled on purpose: React 19 resets uncontrolled form fields after every action, which
  // would wipe the user's text whenever the server returns a validation error.
  const [text, setText] = useState("");
  const [channels, setChannels] = useState<RequestChannel[]>([]);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [objective, setObjective] = useState<RequestObjective | null>(null);
  const [period, setPeriod] = useState<RequestPeriod | null>(null);

  function toggleChannel(channel: RequestChannel) {
    setChannels((current) => (current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel]));
  }

  function applyIdea(idea: IdeaTemplate) {
    setText(idea.text);
    setChannels(idea.channels);
    setQuantity(idea.quantity);
    setObjective(idea.objective);
    setPeriod(idea.period);
    // Select the first "[placeholder]" so the user can type over it right away.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const start = idea.text.indexOf("[");
      const end = idea.text.indexOf("]", start);
      if (start >= 0 && end > start) el.setSelectionRange(start, end + 1);
      else el.setSelectionRange(idea.text.length, idea.text.length);
    });
  }

  const tooShort = text.trim().length < 10;
  const hasPlaceholder = /\[[^\]]+\]/.test(text);
  const summary = [
    channels.length ? channels.map((c) => CHANNEL_LABELS[c]).join(" + ") : "Canais: IA decide",
    quantity ? `${quantity} conteúdo${quantity > 1 ? "s" : ""}` : null,
    objective ? OBJECTIVE_LABELS[objective] : null,
    period ? PERIOD_LABELS[period] : null,
  ].filter(Boolean);

  return (
    <div className="flex w-full flex-col gap-8">
      <form ref={formRef} action={formAction} className="w-full">
        {channels.map((c) => (
          <input key={c} type="hidden" name="channels" value={c} />
        ))}
        <input type="hidden" name="quantity" value={quantity ?? ""} />
        <input type="hidden" name="objective" value={objective ?? ""} />
        <input type="hidden" name="period" value={period ?? ""} />

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/10">
          <div className="p-3">
            <Textarea
              ref={textareaRef}
              name="originalRequest"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !tooShort) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              placeholder="O que você quer comunicar? Quanto mais concreto, melhor: o assunto, o fato real por trás dele (obra, equipamento, norma, vaga) e o que o leitor deve fazer depois."
              className="min-h-32 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-4">
            <OptionRow icon={<Hash className="size-3.5" />} label="Canais" hint={channels.length === 0 ? "Nenhum selecionado: a IA escolhe o melhor canal." : undefined}>
              {(Object.keys(CHANNEL_LABELS) as RequestChannel[]).map((c) => (
                <Chip key={c} selected={channels.includes(c)} onClick={() => toggleChannel(c)}>
                  {CHANNEL_ICONS[c]}
                  {CHANNEL_LABELS[c]}
                </Chip>
              ))}
            </OptionRow>

            <OptionRow icon={<Sparkles className="size-3.5" />} label="Quantidade">
              <Chip selected={quantity === null} onClick={() => setQuantity(null)}>
                IA decide
              </Chip>
              {QUANTITIES.map((q) => (
                <Chip key={q} selected={quantity === q} onClick={() => setQuantity(q)}>
                  {q}
                </Chip>
              ))}
            </OptionRow>

            <OptionRow icon={<Target className="size-3.5" />} label="Objetivo">
              <Chip selected={objective === null} onClick={() => setObjective(null)}>
                IA decide
              </Chip>
              {REQUEST_OBJECTIVES.map((o) => (
                <Chip key={o} selected={objective === o} onClick={() => setObjective(o)}>
                  {OBJECTIVE_LABELS[o]}
                </Chip>
              ))}
            </OptionRow>

            <OptionRow icon={<CalendarDays className="size-3.5" />} label="Período">
              <Chip selected={period === null} onClick={() => setPeriod(null)}>
                Sem prazo
              </Chip>
              {REQUEST_PERIODS.map((p) => (
                <Chip key={p} selected={period === p} onClick={() => setPeriod(p)}>
                  {PERIOD_LABELS[p]}
                </Chip>
              ))}
            </OptionRow>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-xs font-medium text-foreground">{summary.join(" · ")}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Leva alguns minutos com a IA local · Ctrl+Enter para enviar
              </p>
            </div>
            <SubmitButton disabled={tooShort} />
          </div>
        </div>

        {hasPlaceholder && (
          <p className="mt-2 text-center text-xs text-amber-700 dark:text-amber-400">
            Ainda há trechos entre [colchetes] no texto — substitua pelos dados reais para um resultado melhor.
          </p>
        )}
        {state?.error && <p className="mt-2 text-center text-sm text-destructive">{state.error}</p>}
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Lightbulb className="size-4" />
          Ideias para começar
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <button
              key={idea.id}
              type="button"
              onClick={() => applyIdea(idea)}
              className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary">{idea.label}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{idea.text}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
