import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import { ContentActions } from "@/components/delivery/content-actions";
import { buildContentCopyText, buildContentPreview } from "@/lib/content-text";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";
import type { ContentFormat, ContentStatus, Platform } from "@/types/enums";

export type LibraryContentItem = Prisma.GeneratedContentGetPayload<{
  include: {
    project: { select: { id: true; title: true } };
    agentExecution: { select: { agentType: true } };
    reviews: true;
    versions: true;
    comments: true;
  };
}>;

export function LibraryContentCard({ item }: { item: LibraryContentItem }) {
  const preview = buildContentPreview(item.platform as Platform, item.format as ContentFormat, item.content);
  const copyText = buildContentCopyText(item.format as ContentFormat, item.content);

  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.title}</p>
          <Link href={`/projetos/${item.project.id}`} className="text-xs text-muted-foreground hover:underline">
            {item.project.title}
          </Link>
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{item.platform}</Badge>
          <Badge variant="outline">{item.format}</Badge>
        </div>
        {preview && <p className="line-clamp-3 text-sm text-muted-foreground">{preview}</p>}
        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="max-w-full rounded-md" />}
        <p className="text-xs text-muted-foreground">
          {item.scheduledAt ? `Agendado para ${formatDateTime(item.scheduledAt)}` : formatDateTime(item.createdAt)}
        </p>
        <ContentActions
          contentId={item.id}
          copyText={copyText}
          rawContent={item.content}
          status={item.status as ContentStatus}
          scheduledAt={item.scheduledAt}
          versions={item.versions}
          comments={item.comments}
          showArchive
        />
      </CardContent>
    </Card>
  );
}
