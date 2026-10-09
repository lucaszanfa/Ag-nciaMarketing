import { brandFromSettings } from "@/lib/social";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { settingsRepository } from "@/server/repositories/settings.repository";
import { ContentOverviewPanel } from "@/components/delivery/content-overview-panel";
import { getCurrentUser } from "@/lib/auth";
import type { GeneratedContentDetail } from "@/types/project";

function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Single-post view — reached from a calendar card. Shows only that one piece
 * of content instead of the whole project (which also has drafts, rejected
 * variants, etc. mixed in). CEO/Admin can still jump to the full project;
 * Comum can only land here for their own projects or already-scheduled/
 * published content (the same content the shared calendar already shows).
 */
export default async function ContentDetailPage(props: PageProps<"/projetos/[id]/conteudo/[contentId]">) {
  const { id, contentId } = await props.params;
  const [content, settings] = await Promise.all([
    generatedContentRepository.findById(contentId),
    settingsRepository.get(),
  ]);

  if (!content || content.projectId !== id) notFound();

  const user = await getCurrentUser();
  const hasFullAccess = user?.role === "ADMIN" || user?.role === "CEO";
  const isOwner = user?.id === content.project.createdById;
  const isPubliclyVisible = content.status === "SCHEDULED" || content.status === "PUBLISHED";
  if (!hasFullAccess && !isOwner && !isPubliclyVisible) notFound();

  const item = normalize(content) as unknown as GeneratedContentDetail;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/calendario"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao calendário
        </Link>
        {hasFullAccess && (
          <Link
            href={`/projetos/${id}`}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Ver projeto completo
          </Link>
        )}
      </div>

      <ContentOverviewPanel
        linkedinContents={item.platform === "LINKEDIN" ? [item] : []}
        instagramContents={item.platform === "INSTAGRAM" ? [item] : []}
        campaignContent={item.format === "CAMPAIGN_PLAN" ? item : null}
        company={brandFromSettings(settings)}
      />
    </div>
  );
}
