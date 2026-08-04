import { Badge } from "@/components/ui/badge";
import type { GeneratedContentDetail } from "@/types/project";

/** Small "Versão N · X correções automáticas" line, reused by every delivery panel. */
export function VersionInfo({ item }: { item: GeneratedContentDetail }) {
  if (item.currentVersion <= 1 && item.automaticRevisionCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>Versão {item.currentVersion}</span>
      {item.automaticRevisionCount > 0 && <span>· {item.automaticRevisionCount} correção(ões) automática(s)</span>}
      {item.revisionLimitReached && (
        <Badge variant="outline" className="border-transparent bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400">
          Limite de correções atingido
        </Badge>
      )}
    </div>
  );
}
