import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentActions } from "./content-actions";
import { VersionInfo } from "./version-info";
import { InstagramFeedMockup, InstagramReelsMockup, InstagramStoryMockup, type StoryScreen } from "./social-mockups";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type {
  InstagramCarousel,
  InstagramPost,
  InstagramReels,
  InstagramStory,
} from "@/services/ai/schemas";
import type { ContentStatus } from "@/types/enums";
import type { CompanyBrand } from "@/lib/social";

/** Shared layout: the phone-sized mockup on the left, details and actions on the right. */
function ContentCard({
  item,
  formatLabel,
  mockup,
  children,
}: {
  item: GeneratedContentDetail;
  formatLabel: string;
  mockup: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title} · {formatLabel}</CardTitle>
          <VersionInfo item={item} />
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="grid gap-5 text-sm 2xl:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
        <div className="flex justify-center 2xl:justify-start">{mockup}</div>
        <div className="flex min-w-0 flex-col gap-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function Actions({ item, copyText, raw }: { item: GeneratedContentDetail; copyText: string; raw: unknown }) {
  return (
    <ContentActions
      contentId={item.id}
      copyText={copyText}
      rawContent={raw}
      status={item.status as ContentStatus}
      scheduledAt={item.scheduledAt}
      versions={item.versions}
      comments={item.comments}
    />
  );
}

function CarouselCard({ item, company }: { item: GeneratedContentDetail; company: CompanyBrand }) {
  const carousel = item.content as unknown as InstagramCarousel;
  const captionText = [carousel.caption, "", carousel.cta, "", carousel.hashtags.join(" ")].join("\n");
  const copyText = [carousel.caption, "", ...carousel.slides.map((s) => `Slide ${s.order}: ${s.text}`), "", carousel.cta, carousel.hashtags.join(" ")].join("\n");
  const slides = [
    { text: carousel.cover },
    ...[...carousel.slides].sort((a, b) => a.order - b.order).map((s) => ({ title: s.title, text: s.text })),
  ];

  return (
    <ContentCard
      item={item}
      formatLabel="Carrossel"
      mockup={
        <InstagramFeedMockup
          company={company}
          caption={captionText}
          imageUrl={item.imageUrl}
          visualSuggestion={carousel.visualSuggestion}
          slides={slides}
        />
      }
    >
      <p className="text-xs text-muted-foreground">
        Use as setas no mockup para ver os {slides.length} slides. As artes são uma prévia do texto; a arte final segue a
        sugestão visual.
      </p>
      <p className="text-xs text-muted-foreground">Sugestão visual: {carousel.visualSuggestion}</p>
      <Actions item={item} copyText={copyText} raw={carousel} />
    </ContentCard>
  );
}

function ReelsCard({ item, company }: { item: GeneratedContentDetail; company: CompanyBrand }) {
  const reels = item.content as unknown as InstagramReels;
  const captionText = [reels.caption, "", reels.cta, "", reels.hashtags.join(" ")].join("\n");
  const copyText = [reels.caption, "", ...reels.script.map((s) => `${s.moment}: ${s.description}`), "", reels.cta, reels.hashtags.join(" ")].join("\n");

  return (
    <ContentCard
      item={item}
      formatLabel="Reels"
      mockup={
        <InstagramReelsMockup
          company={company}
          caption={captionText}
          imageUrl={item.imageUrl}
          scenes={reels.script.map((s) => ({ moment: s.moment, onScreenText: s.onScreenText, narration: s.narration }))}
        />
      }
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {reels.hook && <span><span className="font-medium text-foreground">Gancho: </span>{reels.hook}</span>}
        {reels.estimatedDuration && <span><span className="font-medium text-foreground">Duração: </span>{reels.estimatedDuration}</span>}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Roteiro</p>
        <ol className="space-y-2">
          {reels.script.map((moment, i) => (
            <li key={i} className="rounded-lg border border-border p-2.5">
              <p className="text-xs font-medium">{i + 1}. {moment.moment}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{moment.description}</p>
              {moment.narration && <p className="mt-1 text-xs"><span className="text-muted-foreground">Narração: </span>{moment.narration}</p>}
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs text-muted-foreground">Sugestão visual: {reels.visualSuggestion}</p>
      <Actions item={item} copyText={copyText} raw={reels} />
    </ContentCard>
  );
}

function PostCard({ item, company }: { item: GeneratedContentDetail; company: CompanyBrand }) {
  const post = item.content as unknown as InstagramPost;
  const captionText = [post.caption, "", post.cta, "", post.hashtags.join(" ")].join("\n");
  const copyText = [post.caption, "", post.cta, post.hashtags.join(" ")].join("\n");

  return (
    <ContentCard
      item={item}
      formatLabel="Post"
      mockup={
        <InstagramFeedMockup
          company={company}
          caption={captionText}
          imageUrl={item.imageUrl}
          visualSuggestion={post.visualSuggestion}
          slides={item.imageUrl ? undefined : [{ title: post.theme, text: post.objective }]}
        />
      }
    >
      {(post.theme || post.objective) && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {post.theme && <span><span className="font-medium text-foreground">Tema: </span>{post.theme}</span>}
          {post.objective && <span><span className="font-medium text-foreground">Objetivo: </span>{post.objective}</span>}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Sugestão visual: {post.visualSuggestion}</p>
      <Actions item={item} copyText={copyText} raw={post} />
    </ContentCard>
  );
}

function StoryCard({ item, company }: { item: GeneratedContentDetail; company: CompanyBrand }) {
  const story = item.content as unknown as InstagramStory;
  const copyText = [...story.frames, "", story.cta].join("\n");
  const screens: StoryScreen[] =
    story.screens?.length > 0
      ? [...story.screens].sort((a, b) => a.order - b.order).map((s) => ({ text: s.text, interactionType: s.interactionType }))
      : story.frames.map((text) => ({ text }));

  return (
    <ContentCard
      item={item}
      formatLabel="Stories"
      mockup={<InstagramStoryMockup company={company} screens={screens} cta={story.cta} imageUrl={item.imageUrl} />}
    >
      <ol className="space-y-1.5">
        {screens.map((screen, i) => (
          <li key={i} className="text-xs">
            <span className="font-medium">{i + 1}. </span>
            {screen.text}
            {screen.interactionType && (
              <Badge variant="outline" className="ml-2 align-middle text-[10px]">{screen.interactionType}</Badge>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs"><span className="font-medium">CTA: </span>{story.cta}</p>
      <p className="text-xs text-muted-foreground">Sugestão visual: {story.visualSuggestion}</p>
      <Actions item={item} copyText={copyText} raw={story} />
    </ContentCard>
  );
}

export function InstagramPanel({ contents, company }: { contents: GeneratedContentDetail[]; company: CompanyBrand }) {
  if (contents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo de Instagram ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {contents.map((item) => {
        if (item.format === "CAROUSEL") return <CarouselCard key={item.id} item={item} company={company} />;
        if (item.format === "REELS") return <ReelsCard key={item.id} item={item} company={company} />;
        if (item.format === "STORIES") return <StoryCard key={item.id} item={item} company={company} />;
        return <PostCard key={item.id} item={item} company={company} />;
      })}
    </div>
  );
}
