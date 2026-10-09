import { LinkedInPanel } from "./linkedin-panel";
import { InstagramPanel } from "./instagram-panel";
import { CampaignPanel } from "./campaign-panel";
import type { GeneratedContentDetail } from "@/types/project";

/**
 * The main "what did this project actually produce" view — every generated
 * piece across all platforms, stacked in one place. Sections with nothing
 * generated (e.g. a writer that was skipped because the plan didn't call for
 * that platform) are omitted instead of showing an empty-state message per
 * platform, so this reads as a clean deliverable rather than a form.
 */
export function ContentOverviewPanel({
  linkedinContents,
  instagramContents,
  campaignContent,
  company,
}: {
  linkedinContents: GeneratedContentDetail[];
  instagramContents: GeneratedContentDetail[];
  campaignContent: GeneratedContentDetail | null;
  company: { name: string; logoUrl: string | null };
}) {
  const hasCampaign = campaignContent !== null;
  const hasAnything = linkedinContents.length > 0 || instagramContents.length > 0 || hasCampaign;

  if (!hasAnything) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo gerado ainda.</p>;
  }

  return (
    <div className="space-y-6">
      {linkedinContents.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">LinkedIn</h3>
          <LinkedInPanel contents={linkedinContents} company={company} />
        </section>
      )}
      {instagramContents.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Instagram</h3>
          <InstagramPanel contents={instagramContents} company={company} />
        </section>
      )}
      {hasCampaign && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Campanha</h3>
          <CampaignPanel content={campaignContent} />
        </section>
      )}
    </div>
  );
}
