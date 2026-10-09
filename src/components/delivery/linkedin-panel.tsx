import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentActions } from "./content-actions";
import { VersionInfo } from "./version-info";
import { LinkedInPostMockup } from "./social-mockups";
import { ContentStatusBadge } from "@/components/workflow/status-badge";
import type { GeneratedContentDetail } from "@/types/project";
import type { LinkedInPost } from "@/services/ai/schemas";
import type { ContentStatus } from "@/types/enums";
import type { CompanyBrand } from "@/lib/social";

export function LinkedInPanel({
  contents,
  company,
}: {
  contents: GeneratedContentDetail[];
  company: CompanyBrand;
}) {
  if (contents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum conteúdo de LinkedIn ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {contents.map((item) => {
        const post = item.content as unknown as LinkedInPost;
        const copyText = [
          post.hook,
          "",
          post.body,
          "",
          post.cta,
          "",
          post.hashtags.join(" "),
        ].join("\n");

        return (
          <Card key={item.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <VersionInfo item={item} />
              </div>
              <ContentStatusBadge status={item.status as ContentStatus} />
            </CardHeader>
            <CardContent className="grid gap-5 text-sm 2xl:grid-cols-[minmax(0,555px)_minmax(0,1fr)]">
              <LinkedInPostMockup
                company={company}
                text={copyText}
                imageUrl={item.imageUrl}
                visualSuggestion={post.visualSuggestion}
              />
              <div className="flex min-w-0 flex-col gap-3">
                {(post.objective || post.audience) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {post.objective && (
                      <span>
                        <span className="font-medium text-foreground">
                          Objetivo:{" "}
                        </span>
                        {post.objective}
                      </span>
                    )}
                    {post.audience && (
                      <span>
                        <span className="font-medium text-foreground">
                          Público:{" "}
                        </span>
                        {post.audience}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Sugestão visual: {post.visualSuggestion}
                </p>
                {post.strategicNotes?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Observações estratégicas:
                    </p>
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
