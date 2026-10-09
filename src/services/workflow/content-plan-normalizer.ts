import type { ChiefEditorPlan, ContentPlanItem } from "@/services/ai/schemas/chief-editor.schema";
import { addDaysIso, periodRange, todayIso, type RequestOptions } from "@/lib/project-request";

const LINKEDIN_FORMATS = new Set(["POST", "ARTICLE"]);
const INSTAGRAM_FORMATS = new Set(["POST", "CAROUSEL", "REELS", "STORIES"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fixes platform/format combinations no writer can produce (e.g. a LinkedIn carousel). */
function fixFormat(item: ContentPlanItem): ContentPlanItem {
  if (item.format === "CAMPAIGN_PLAN") return { ...item, platform: "GENERAL" };
  if (item.platform === "GENERAL") return { ...item, platform: "LINKEDIN", format: "POST" };
  if (item.platform === "LINKEDIN" && !LINKEDIN_FORMATS.has(item.format)) return { ...item, format: "POST" };
  if (item.platform === "INSTAGRAM" && !INSTAGRAM_FORMATS.has(item.format)) return { ...item, format: "POST" };
  return item;
}

/**
 * Makes the Chief Editor's plan obey what the request actually asked for. Small local models
 * often ignore explicit instructions (wrong channel, extra items, invalid formats, dates in the
 * past or in free text), and every downstream writer trusts this plan blindly.
 */
export function normalizeContentPlan(plan: ChiefEditorPlan, options: RequestOptions | null): ChiefEditorPlan {
  let items = plan.contentPlan.map(fixFormat);

  if (options && options.channels.length > 0) {
    const wantsCampaign = options.channels.includes("CAMPAIGN");
    const socialChannels = options.channels.filter((c) => c !== "CAMPAIGN");

    let campaignItems = items.filter((i) => i.format === "CAMPAIGN_PLAN");
    let socialItems = items.filter((i) => i.format !== "CAMPAIGN_PLAN");

    if (socialChannels.length > 0) {
      const allowed = socialItems.filter((i) => (socialChannels as string[]).includes(i.platform));
      // Model planned only for channels nobody asked for: keep its ideas, move them to the requested channel.
      socialItems =
        allowed.length > 0
          ? allowed
          : socialItems.map((i) => fixFormat({ ...i, platform: socialChannels[0] as "LINKEDIN" | "INSTAGRAM" }));
    } else {
      socialItems = []; // only a campaign was requested
    }

    if (!wantsCampaign) campaignItems = [];
    if (wantsCampaign && campaignItems.length === 0) {
      const base = plan.contentPlan[0];
      campaignItems = [
        {
          id: "campaign-1",
          platform: "GENERAL",
          format: "CAMPAIGN_PLAN",
          theme: plan.projectTitle || base?.theme || "Campanha",
          objective: plan.objective,
          briefing: `${plan.summary}\nMensagem principal: ${plan.mainMessage}`,
          suggestedDate: base?.suggestedDate ?? todayIso(),
        },
      ];
    }
    const filtered = [...socialItems, ...campaignItems.slice(0, 1)];
    if (filtered.length > 0) items = filtered;
  }

  if (options?.quantity) {
    const social = items.filter((i) => i.format !== "CAMPAIGN_PLAN").slice(0, options.quantity);
    const campaign = items.filter((i) => i.format === "CAMPAIGN_PLAN");
    items = [...social, ...campaign];
  }

  // Dates: must be YYYY-MM-DD, not in the past, inside the requested period when there is one.
  const today = todayIso();
  const range = options?.period ? periodRange(options.period, today) : null;
  const from = range?.from ?? addDaysIso(today, 1);
  const to = range?.to ?? null;
  items = items.map((item, index) => {
    const date = item.suggestedDate?.trim();
    const valid = date && ISO_DATE.test(date) && date >= today && date >= (range?.from ?? today) && (!to || date <= to);
    if (valid) return item;
    let fallback = addDaysIso(from, index * 2);
    if (to && fallback > to) fallback = to;
    return { ...item, suggestedDate: fallback };
  });

  // Unique ids — writers echo them back as `briefId`, duplicates would cross wires.
  const seen = new Set<string>();
  items = items.map((item, index) => {
    const id = item.id?.trim() && !seen.has(item.id.trim()) ? item.id.trim() : `${item.platform.toLowerCase()}-${index + 1}`;
    seen.add(id);
    return { ...item, id };
  });

  return { ...plan, contentPlan: items };
}
