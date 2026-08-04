import { NextResponse } from "next/server";
import { createProjectAndStartWorkflow } from "@/server/services/create-project";
import { buildCampaignRequestText } from "@/lib/campaign-prompt";
import { automationCampaignSchema } from "@/validations/project.validation";

/**
 * Inbound endpoint for automations (e.g. an n8n workflow reading a calendar of
 * commemorative-date campaigns) to create a project directly — no human types
 * a prompt here; the request text is built from the structured fields below.
 * The generated project still stops at WAITING_HUMAN_APPROVAL like any other.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição precisa ser um JSON válido." }, { status: 400 });
  }

  const parsed = automationCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const originalRequest = buildCampaignRequestText(parsed.data);
  const { id } = await createProjectAndStartWorkflow(originalRequest);

  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:3000";
  return NextResponse.json({ projectId: id, url: `${baseUrl}/projetos/${id}` }, { status: 201 });
}
