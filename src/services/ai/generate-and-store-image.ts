import { generatedContentRepository } from "@/server/repositories/generated-content.repository";
import { generateContentImage } from "./image-generation";
import { saveContentImage } from "./image-storage";

/**
 * Best-effort image generation + storage for one piece of content. Never
 * throws — a failed or unavailable image (no API key, rate limit, content
 * policy rejection) just leaves `imageUrl` unset, same fail-safe philosophy
 * as the n8n approval-notification webhook.
 */
export async function generateAndStoreContentImage(
  contentId: string,
  visualSuggestion: string,
  aspectRatio?: string
): Promise<void> {
  try {
    const image = await generateContentImage(visualSuggestion, aspectRatio);
    if (!image) return;

    const imageUrl = await saveContentImage(contentId, image.buffer, image.mimeType);
    await generatedContentRepository.updateImageUrl(contentId, imageUrl);
  } catch (error) {
    console.error(`[generate-and-store-image] failed for content "${contentId}":`, error);
  }
}
