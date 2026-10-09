import { NextResponse } from "next/server";
import { curateNewsAndCreateProjects } from "@/server/services/curate-news";
import { automationNewsSchema } from "@/validations/project.validation";

/**
 * Inbound endpoint for automations (e.g. the weekly n8n workflow reading Google News RSS) that
 * hand over a batch of recent headlines. The app's curator agent picks only the ones genuinely
 * relevant for the company — with the technical angle to use — and creates one project per
 * selected headline. Waits for the curation (one AI call, typically under a minute on a local
 * model); the projects themselves run in the background, one after another.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição precisa ser um JSON válido." }, { status: 400 });
  }

  const parsed = automationNewsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const result = await curateNewsAndCreateProjects(parsed.data);

  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:3000";
  return NextResponse.json(
    {
      criados: result.created.map((p) => ({ ...p, url: `${baseUrl}/projetos/${p.projectId}` })),
      descartados: result.discarded,
      aviso: result.usedFallback
        ? "A IA não respondeu; nenhuma notícia foi selecionada. Verifique o LM Studio."
        : undefined,
    },
    { status: result.created.length > 0 ? 201 : 200 }
  );
}
