import { NextResponse } from "next/server";
import { projectRepository } from "@/server/repositories/project.repository";

export async function GET(_request: Request, context: RouteContext<"/api/projects/[id]">) {
  const { id } = await context.params;

  const project = await projectRepository.findById(id);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(_request: Request, context: RouteContext<"/api/projects/[id]">) {
  const { id } = await context.params;
  await projectRepository.delete(id);
  return NextResponse.json({ ok: true });
}
