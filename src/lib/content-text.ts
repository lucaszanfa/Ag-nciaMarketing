import type { ContentFormat, Platform } from "@/types/enums";
import type {
  CampaignWriterOutput,
  InstagramCarousel,
  InstagramPost,
  InstagramReels,
  InstagramStory,
  LinkedInPost,
} from "@/services/ai/schemas";

/**
 * Plain-text version of a generated content item, used by "Copiar" and previews.
 * Falls back to raw JSON if `content` doesn't match the shape the given `format`
 * normally has — e.g. a Chief Editor briefing (`{objective, briefing, suggestedDate}`)
 * sharing a platform/format with a finished post but not its field shape.
 */
export function buildContentCopyText(format: ContentFormat, content: unknown): string {
  try {
    switch (format) {
      case "POST": {
        const post = content as LinkedInPost | InstagramPost;
        const hook = "hook" in post ? post.hook : undefined;
        const body = "body" in post ? post.body : "caption" in post ? post.caption : "";
        return [hook, body, post.cta, post.hashtags.join(" ")].filter(Boolean).join("\n\n");
      }
      case "CAROUSEL": {
        const carousel = content as InstagramCarousel;
        return [
          carousel.caption,
          ...carousel.slides.map((s) => `Slide ${s.order}${s.title ? ` (${s.title})` : ""}: ${s.text}`),
          carousel.cta,
          carousel.hashtags.join(" "),
        ].join("\n");
      }
      case "REELS": {
        const reels = content as InstagramReels;
        return [
          reels.hook,
          ...reels.script.map((s) => `${s.moment}: ${s.narration ?? s.description}`),
          reels.caption,
          reels.cta,
          reels.hashtags.join(" "),
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "STORIES": {
        const story = content as InstagramStory;
        const screensText = story.screens?.length ? story.screens.map((s) => s.text) : story.frames;
        return [...screensText, story.cta].join("\n");
      }
      case "CAMPAIGN_PLAN": {
        const campaign = content as CampaignWriterOutput;
        return [
          campaign.name,
          campaign.concept,
          `Objetivo: ${campaign.objective}`,
          `Mensagem principal: ${campaign.mainMessage}`,
          `CTA: ${campaign.cta}`,
        ].join("\n");
      }
      default:
        return JSON.stringify(content, null, 2);
    }
  } catch {
    return JSON.stringify(content, null, 2);
  }
}

/** The AI-writer's suggested visual direction for a piece of content — used as the image-generation prompt. Campaign plans have no single visual, so this returns null for them. */
export function getVisualSuggestion(format: ContentFormat, content: unknown): string | null {
  try {
    if (format === "CAMPAIGN_PLAN") return null;
    const value = content as { visualSuggestion?: string };
    return value.visualSuggestion ?? null;
  } catch {
    return null;
  }
}

export function buildContentPreview(platform: Platform, format: ContentFormat, content: unknown): string {
  if (format === "POST" || format === "REELS" || format === "STORIES") {
    const value = content as { caption?: string; body?: string };
    return value.caption ?? value.body ?? "";
  }
  if (format === "CAROUSEL") return (content as InstagramCarousel).caption ?? "";
  if (format === "CAMPAIGN_PLAN") return (content as CampaignWriterOutput).concept ?? "";
  return "";
}
