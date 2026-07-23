import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentActions } from "./content-actions";
import { VersionInfo } from "./version-info";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type {
  InstagramCarousel,
  InstagramPost,
  InstagramReels,
  InstagramStory,
} from "@/services/ai/schemas";
import type { ContentStatus } from "@/types/enums";

function CarouselCard({ item }: { item: GeneratedContentDetail }) {
  const carousel = item.content as unknown as InstagramCarousel;
  const copyText = [carousel.caption, "", ...carousel.slides.map((s) => `Slide ${s.order}: ${s.text}`), "", carousel.cta, carousel.hashtags.join(" ")].join("\n");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title} · Carrossel</CardTitle>
          <VersionInfo item={item} />
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">Capa: {carousel.cover}</p>
        <ol className="list-inside list-decimal space-y-1">
          {carousel.slides.map((slide) => (
            <li key={slide.order}>{slide.title ? <span className="font-medium">{slide.title}: </span> : null}{slide.text}</li>
          ))}
        </ol>
        <p className="whitespace-pre-wrap">{carousel.caption}</p>
        <p className="font-medium">{carousel.cta}</p>
        <div className="flex flex-wrap gap-1.5">
          {carousel.hashtags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sugestão visual: {carousel.visualSuggestion}</p>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={carousel.visualSuggestion} className="max-w-full rounded-md" />
        )}
        <ContentActions
          contentId={item.id}
          copyText={copyText}
          rawContent={carousel}
          status={item.status as ContentStatus}
          scheduledAt={item.scheduledAt}
          versions={item.versions}
          comments={item.comments}
        />
      </CardContent>
    </Card>
  );
}

function ReelsCard({ item }: { item: GeneratedContentDetail }) {
  const reels = item.content as unknown as InstagramReels;
  const copyText = [reels.caption, "", ...reels.script.map((s) => `${s.moment}: ${s.description}`), "", reels.cta, reels.hashtags.join(" ")].join("\n");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title} · Reels</CardTitle>
          <VersionInfo item={item} />
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(reels.hook || reels.estimatedDuration) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {reels.hook && <span><span className="font-medium text-foreground">Gancho: </span>{reels.hook}</span>}
            {reels.estimatedDuration && <span><span className="font-medium text-foreground">Duração: </span>{reels.estimatedDuration}</span>}
          </div>
        )}
        <div className="space-y-1.5">
          {reels.script.map((moment) => (
            <div key={moment.moment}>
              <p>
                <span className="font-medium">{moment.moment}: </span>
                {moment.description}
              </p>
              {(moment.narration || moment.onScreenText) && (
                <p className="text-xs text-muted-foreground">
                  {moment.narration && <>Narração: {moment.narration}</>}
                  {moment.narration && moment.onScreenText && " · "}
                  {moment.onScreenText && <>Texto na tela: {moment.onScreenText}</>}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="whitespace-pre-wrap">{reels.caption}</p>
        <p className="font-medium">{reels.cta}</p>
        <div className="flex flex-wrap gap-1.5">
          {reels.hashtags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sugestão visual: {reels.visualSuggestion}</p>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={reels.visualSuggestion} className="max-w-full rounded-md" />
        )}
        <ContentActions
          contentId={item.id}
          copyText={copyText}
          rawContent={reels}
          status={item.status as ContentStatus}
          scheduledAt={item.scheduledAt}
          versions={item.versions}
          comments={item.comments}
        />
      </CardContent>
    </Card>
  );
}

function PostCard({ item }: { item: GeneratedContentDetail }) {
  const post = item.content as unknown as InstagramPost;
  const copyText = [post.caption, "", post.cta, post.hashtags.join(" ")].join("\n");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title} · Post</CardTitle>
          <VersionInfo item={item} />
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(post.theme || post.objective) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {post.theme && <span><span className="font-medium text-foreground">Tema: </span>{post.theme}</span>}
            {post.objective && <span><span className="font-medium text-foreground">Objetivo: </span>{post.objective}</span>}
          </div>
        )}
        <p className="whitespace-pre-wrap">{post.caption}</p>
        <p className="font-medium">{post.cta}</p>
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sugestão visual: {post.visualSuggestion}</p>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={post.visualSuggestion} className="max-w-full rounded-md" />
        )}
        <ContentActions
          contentId={item.id}
          copyText={copyText}
          rawContent={post}
          status={item.status as ContentStatus}
          scheduledAt={item.scheduledAt}
          versions={item.versions}
          comments={item.comments}
        />
      </CardContent>
    </Card>
  );
}

function StoryCard({ item }: { item: GeneratedContentDetail }) {
  const story = item.content as unknown as InstagramStory;
  const copyText = [...story.frames, "", story.cta].join("\n");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title} · Stories</CardTitle>
          <VersionInfo item={item} />
        </div>
        <ContentStatusBadge status={item.status as ContentStatus} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {story.screens?.length > 0 ? (
          <ol className="list-inside list-decimal space-y-1">
            {story.screens.map((screen) => (
              <li key={screen.order}>
                {screen.text}
                {screen.interactionType && (
                  <Badge variant="outline" className="ml-2 align-middle text-xs">{screen.interactionType}</Badge>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <ol className="list-inside list-decimal space-y-1">
            {story.frames.map((frame, i) => (
              <li key={i}>{frame}</li>
            ))}
          </ol>
        )}
        <p className="font-medium">{story.cta}</p>
        <p className="text-xs text-muted-foreground">Sugestão visual: {story.visualSuggestion}</p>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={story.visualSuggestion} className="max-w-full rounded-md" />
        )}
        <ContentActions
          contentId={item.id}
          copyText={copyText}
          rawContent={story}
          status={item.status as ContentStatus}
          scheduledAt={item.scheduledAt}
          versions={item.versions}
          comments={item.comments}
        />
      </CardContent>
    </Card>
  );
}

export function InstagramPanel({ contents }: { contents: GeneratedContentDetail[] }) {
  if (contents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo de Instagram ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {contents.map((item) => {
        if (item.format === "CAROUSEL") return <CarouselCard key={item.id} item={item} />;
        if (item.format === "REELS") return <ReelsCard key={item.id} item={item} />;
        if (item.format === "STORIES") return <StoryCard key={item.id} item={item} />;
        return <PostCard key={item.id} item={item} />;
      })}
    </div>
  );
}
