"use client";

import { useState, useTransition } from "react";
import { Loader2, Zap, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compareProviders } from "@/server/actions/compare.actions";
import { platformLabel, contentFormatLabel } from "@/lib/content-labels";
import type { ProviderComparisonResult } from "@/services/ai/compare-providers";

function ResultColumn({ result }: { result: ProviderComparisonResult }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{result.providerLabel}</CardTitle>
          {result.model && <p className="mt-1 text-xs text-muted-foreground">{result.model}</p>}
        </div>
        {result.durationMs != null && (
          <span className="shrink-0 text-xs text-muted-foreground">{(result.durationMs / 1000).toFixed(1)}s</span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {result.error ? (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs">{result.error}</p>
          </div>
        ) : result.plan ? (
          <>
            <div>
              <p className="font-semibold">{result.plan.projectTitle}</p>
              <p className="mt-1 text-muted-foreground">{result.plan.summary}</p>
            </div>
            <p>
              <span className="font-medium">Objetivo: </span>
              {result.plan.objective}
            </p>
            <p>
              <span className="font-medium">Tom: </span>
              {result.plan.tone}
            </p>
            <p>
              <span className="font-medium">CTA: </span>
              {result.plan.primaryCta}
            </p>
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Plano de conteúdo ({result.plan.contentPlan.length})
              </p>
              {result.plan.contentPlan.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <p className="font-medium">{item.theme}</p>
                    <div className="flex gap-1">
                      <Badge variant="outline">{platformLabel(item.platform)}</Badge>
                      <Badge variant="outline">{contentFormatLabel(item.format)}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-muted-foreground">{item.briefing}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CompareProvidersForm() {
  const [request, setRequest] = useState("");
  const [results, setResults] = useState<[ProviderComparisonResult, ProviderComparisonResult] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const data = await compareProviders(request);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao comparar provedores.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Ex: Quero uma campanha para divulgar nosso novo serviço durante o próximo mês..."
          className="min-h-28"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {isPending ? "Comparando..." : "Comparar Gemini × LM Studio"}
          </Button>
          {isPending && (
            <p className="text-xs text-muted-foreground">
              Pode levar um tempo — o LM Studio costuma ser bem mais lento que o Gemini.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      {results && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResultColumn result={results[0]} />
          <ResultColumn result={results[1]} />
        </div>
      )}
    </div>
  );
}
