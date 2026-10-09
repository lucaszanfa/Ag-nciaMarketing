import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platformLabel, contentFormatLabel } from "@/lib/content-labels";
import { ScheduleDialog } from "./schedule-dialog";

export interface UnscheduledItem {
  id: string;
  title: string;
  platform: string;
  format: string;
  project: { id: string; title: string };
}

export function UnscheduledSidebar({ items, readOnly = false }: { items: UnscheduledItem[]; readOnly?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Aguardando agendamento ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-[70vh] flex-col gap-2.5 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum conteúdo aprovado aguardando data de publicação.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-2.5 text-sm">
            <Link href={`/projetos/${item.project.id}`} className="line-clamp-2 font-medium hover:underline">
              {item.title}
            </Link>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">{platformLabel(item.platform)}</Badge>
              <Badge variant="outline" className="text-[10px]">{contentFormatLabel(item.format)}</Badge>
            </div>
            {!readOnly && (
              <div className="mt-2">
                <ScheduleDialog contentId={item.id} triggerLabel="Agendar" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
