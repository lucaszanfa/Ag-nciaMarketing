/**
 * Outbound push notification to an n8n workflow — the app calls n8n's
 * Webhook-trigger URL once per project review cycle (batched, not one call
 * per content item) whenever content reaches WAITING_HUMAN_APPROVAL; n8n
 * takes it from there (Slack/e-mail/Teams/whatever node the workflow is
 * built with). Configuring the destination channel is entirely done inside
 * n8n, not here.
 *
 * Inactive by default: with no N8N_APPROVAL_WEBHOOK_URL set, this is a no-op
 * so the review/approval flow never depends on an external service existing.
 *
 * Always sent as a `count` + `items` array, even when there's only one item
 * (e.g. a single manual "send back to agent" correction) — one payload shape
 * to build a message template around in n8n, instead of two.
 */
export type PendingApprovalReason =
  | "approved_by_ai"
  | "requires_human_decision"
  | "revision_limit_reached"
  | "cannot_auto_revise"
  | "manual_revision";

export interface PendingApprovalItem {
  contentId: string;
  contentTitle: string;
  platform: string;
  format: string;
  reason: PendingApprovalReason;
}

export interface PendingApprovalBatch {
  projectId: string;
  projectTitle: string;
  items: PendingApprovalItem[];
}

export function projectUrl(projectId: string): string {
  const base = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:3000";
  return `${base}/projetos/${projectId}`;
}

/** Links to the single-post view instead of the whole project — used wherever a notification is about one specific piece of content (e.g. "post agendado para hoje"), not a batch. */
export function contentUrl(projectId: string, contentId: string): string {
  return `${projectUrl(projectId)}/conteudo/${contentId}`;
}

/**
 * Outbound push to a *separate* n8n workflow whose job is to generate an image for each
 * content item and send it back (see `POST /api/automation/content/[id]/image`) — deliberately
 * a different webhook/workflow than `notifyPendingApproval` so the two automations can be
 * built, activated, and changed independently. Same fire-and-forget, never-throws philosophy:
 * a failed/unset notification never blocks the review/approval flow.
 */
export async function notifyContentReadyForImage(batch: PendingApprovalBatch): Promise<void> {
  if (batch.items.length === 0) return;

  const webhookUrl = process.env.N8N_IMAGE_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content.ready_for_image",
        projectId: batch.projectId,
        projectTitle: batch.projectTitle,
        count: batch.items.length,
        items: batch.items,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[n8n-webhook] image-generation notification rejected: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("[n8n-webhook] image-generation notification failed:", error);
  }
}

export async function notifyPendingApproval(batch: PendingApprovalBatch): Promise<void> {
  if (batch.items.length === 0) return;

  const webhookUrl = process.env.N8N_APPROVAL_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content.waiting_human_approval",
        link: projectUrl(batch.projectId),
        projectId: batch.projectId,
        projectTitle: batch.projectTitle,
        count: batch.items.length,
        items: batch.items,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[n8n-webhook] pending-approval notification rejected: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // A notification failure must never break the review/approval flow.
    console.error("[n8n-webhook] pending-approval notification failed:", error);
  }
}
