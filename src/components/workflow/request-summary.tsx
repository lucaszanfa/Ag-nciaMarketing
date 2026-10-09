import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_LABELS,
  OBJECTIVE_LABELS,
  PERIOD_LABELS,
  parseRequestOptions,
} from "@/lib/project-request";

/** What was asked for: the structured options and, for automated "pautas", the source news item. */
export function RequestSummary({ requestOptions }: { requestOptions: unknown }) {
  const options = parseRequestOptions(requestOptions);
  if (!options) return null;

  const badges = [
    ...options.channels.map((c) => CHANNEL_LABELS[c]),
    options.quantity ? `${options.quantity} conteúdo${options.quantity > 1 ? "s" : ""}` : null,
    options.objective ? OBJECTIVE_LABELS[options.objective] : null,
    options.period ? PERIOD_LABELS[options.period] : null,
  ].filter((b): b is string => b !== null);

  const news = options.newsHook;
  if (badges.length === 0 && !news) return null;

  return (
    <div className="flex flex-col gap-2">
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <Badge key={b} variant="outline">
              {b}
            </Badge>
          ))}
        </div>
      )}
      {news && (
        <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <Newspaper className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-medium">
              {news.link ? (
                <a href={news.link} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:underline">
                  {news.headline}
                  <ExternalLink className="mt-1 size-3 shrink-0" />
                </a>
              ) : (
                news.headline
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {[news.source, news.publishedAt].filter(Boolean).join(" · ")}
            </p>
            {news.angle && (
              <p className="text-xs">
                <span className="font-medium">Ângulo escolhido pela IA: </span>
                {news.angle}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
