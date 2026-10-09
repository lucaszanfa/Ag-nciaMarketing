import { NextResponse } from "next/server";
import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { getVisualSuggestion } from "@/lib/content-text";
import type { ContentFormat } from "@/types/enums";

/**
 * Read-only endpoint for the image-generation automation (see N8N_IMAGE_WEBHOOK_URL): given a
 * contentId from the `content.ready_for_image` webhook payload, returns just enough to build an
 * image prompt — title, format, and the writer's own suggested visual direction — plus the
 * current `imageUrl` so the automation can skip content that already has one.
 */
export async function GET(_request: Request, context: RouteContext<"/api/automation/content/[id]">) {
  const { id } = await context.params;

  const content = await generatedContentRepository.findById(id);
  if (!content) {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    contentId: content.id,
    projectId: content.projectId,
    title: content.title,
    platform: content.platform,
    format: content.format,
    visualSuggestion: getVisualSuggestion(content.format as ContentFormat, content.content),
    imageUrl: content.imageUrl,
  });
}
