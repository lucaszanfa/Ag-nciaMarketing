import { z } from "zod";

export const instagramCarouselSchema = z.object({
  /** Id of the Chief Editor's content-plan item this piece fulfills. */
  briefId: z.string(),
  internalTitle: z.string().min(1),
  cover: z.string().min(1),
  slides: z.array(
    z.object({
      order: z.number().int().positive(),
      title: z.string().min(1),
      text: z.string().min(1),
    })
  ),
  caption: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()),
  visualSuggestion: z.string().min(1),
});

export const instagramReelsSchema = z.object({
  briefId: z.string(),
  internalTitle: z.string().min(1),
  hook: z.string().min(1),
  estimatedDuration: z.string().min(1),
  script: z.array(
    z.object({
      moment: z.string(),
      description: z.string(),
      narration: z.string().min(1),
      onScreenText: z.string().min(1),
    })
  ),
  caption: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()),
  visualSuggestion: z.string().min(1),
});

export const instagramPostSchema = z.object({
  briefId: z.string(),
  internalTitle: z.string().min(1),
  theme: z.string().min(1),
  objective: z.string().min(1),
  caption: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()),
  visualSuggestion: z.string().min(1),
});

export const instagramStorySchema = z
  .object({
    briefId: z.string(),
    internalTitle: z.string().min(1),
    screens: z
      .array(
        z.object({
          order: z.number().int().positive(),
          text: z.string().min(1),
          interactionType: z.string().min(1),
        })
      )
      .min(1),
    /** Derived from `screens` when the model/fallback doesn't set it explicitly — kept for older consumers (e.g. `content-text.ts`). */
    frames: z.array(z.string()).default([]),
    cta: z.string().min(1),
    visualSuggestion: z.string().min(1),
  })
  .transform((story) => ({
    ...story,
    frames: story.frames.length > 0 ? story.frames : story.screens.map((screen) => screen.text),
  }));

export const instagramWriterOutputSchema = z.object({
  carousels: z.array(instagramCarouselSchema).default([]),
  reels: z.array(instagramReelsSchema).default([]),
  posts: z.array(instagramPostSchema).default([]),
  stories: z.array(instagramStorySchema).default([]),
});

export type InstagramCarousel = z.infer<typeof instagramCarouselSchema>;
export type InstagramReels = z.infer<typeof instagramReelsSchema>;
export type InstagramPost = z.infer<typeof instagramPostSchema>;
export type InstagramStory = z.infer<typeof instagramStorySchema>;
export type InstagramWriterOutput = z.infer<typeof instagramWriterOutputSchema>;
