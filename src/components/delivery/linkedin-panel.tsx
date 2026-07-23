import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentActions } from "./content-actions";
import { VersionInfo } from "./version-info";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type { LinkedInPost } from "@/services/ai/schemas";
import type { ContentStatus } from "@/types/enums";

export function LinkedInPanel({ contents }: { contents: GeneratedContentDetail[] }) {
  if (contents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo de LinkedIn ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {contents.map((item) => {
        const post = item.content as unknown as LinkedInPost;
        const copyText = [post.hook, "", post.body, "", post.cta, "", post.hashtags.join(" ")].join("\n");

        return (
          <Card key={item.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <VersionInfo item={item} />
              </div>
              <ContentStatusBadge status={item.status as ContentStatus} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(post.objective || post.audience) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {post.objective && <span><span className="font-medium text-foreground">Objetivo: </span>{post.objective}</span>}
                  {post.audience && <span><span className="font-medium text-foreground">Público: </span>{post.audience}</span>}
                </div>
              )}
              <p className="font-medium">{post.hook}</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{post.body}</p>
              <p className="font-medium">{post.cta}</p>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={post.visualSuggestion} className="max-w-full rounded-md" />
              )}
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Sugestão visual: {post.visualSuggestion}</p>
              {post.strategicNotes?.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Observações estratégicas:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {post.strategicNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
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
      })}
    </div>
  );
}
