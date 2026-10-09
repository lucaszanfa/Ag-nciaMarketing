import type { ContentFormat, Platform } from "@/types/enums";

export const PLATFORM_LABELS: Record<Platform, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  BLOG: "Blog",
  EMAIL: "E-mail",
  GENERAL: "Geral",
};

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  POST: "Post",
  CAROUSEL: "Carrossel",
  REELS: "Reels",
  STORIES: "Stories",
  ARTICLE: "Artigo",
  CAMPAIGN_PLAN: "Campanha",
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform as Platform] ?? platform;
}

export function contentFormatLabel(format: string): string {
  return CONTENT_FORMAT_LABELS[format as ContentFormat] ?? format;
}
