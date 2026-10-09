import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRequestOptions, type RequestOptions } from "@/lib/project-request";
import { buildCompanyContext } from "@/services/ai/company-context.service";
import { newsCuratorAgent } from "@/services/ai/agents/news-curator.agent";
import { runWorkflow } from "@/services/workflow/workflow-runner";
import { createProjectAndStartWorkflow } from "./create-project";
import type { AutomationNewsInput } from "@/validations/project.validation";

/** Minimum curator score (0-10) for a headline to become a project. */
const MIN_RELEVANCE = 7;
const DEDUPE_WINDOW_DAYS = 120;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["para", "como", "sobre", "mais", "apos", "entre", "pela", "pelo", "novo", "nova", "anos"]);

/** Rough word stems of a headline, for spotting the same story told by different outlets. */
function stems(headline: string): Set<string> {
  return new Set(
    normalize(headline)
      .split(" ")
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
      .map((w) => w.slice(0, 5))
  );
}

function sameStory(a: string, b: string): boolean {
  const sa = stems(a);
  const sb = stems(b);
  const shared = [...sa].filter((s) => sb.has(s)).length;
  return shared >= 3 && shared / Math.min(sa.size, sb.size) >= 0.4;
}

/** Headlines already used by a project recently — automations re-send the same news every week. */
async function recentlyUsedHeadlines(): Promise<Set<string>> {
  const since = new Date(Date.now() - DEDUPE_WINDOW_DAYS * 24 * 3600 * 1000);
  const projects = await prisma.project.findMany({
    where: { createdAt: { gte: since } },
    select: { requestOptions: true },
  });
  const used = new Set<string>();
  for (const p of projects) {
    const headline = parseRequestOptions(p.requestOptions)?.newsHook?.headline;
    if (headline) used.add(normalize(headline));
  }
  return used;
}

export interface CuratedNewsResult {
  created: { projectId: string; headline: string; relevance: number; angle: string }[];
  discarded: { headline: string; relevance: number | null; reason: string }[];
  usedFallback: boolean;
}

/**
 * Turns a batch of raw headlines into projects — but only the ones the curator agent judges
 * genuinely relevant for the company, each with the technical angle the post should take.
 * The selected projects run one after another in the background (a single local model handles
 * one generation well; several at once just make all of them slow).
 */
export async function curateNewsAndCreateProjects(input: AutomationNewsInput): Promise<CuratedNewsResult> {
  const used = await recentlyUsedHeadlines();
  const seen = new Set<string>();
  const discarded: CuratedNewsResult["discarded"] = [];

  const candidates = input.candidatos.filter((c) => {
    const key = normalize(c.titulo);
    if (used.has(key)) {
      discarded.push({ headline: c.titulo, relevance: null, reason: "Já usada em um projeto recente." });
      return false;
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (candidates.length === 0) return { created: [], discarded, usedFallback: false };

  const company = await buildCompanyContext();
  const result = await newsCuratorAgent.execute({
    company,
    candidates: candidates.map((c) => ({ headline: c.titulo, source: c.fonte, publishedAt: c.data })),
  });

  const evaluations = result.data.evaluations
    .filter((e) => e.index >= 1 && e.index <= candidates.length)
    .sort((a, b) => b.relevance - a.relevance);

  const selected: typeof evaluations = [];
  for (const e of evaluations) {
    if (selected.length >= input.maxPautas) break;
    if (e.relevance < MIN_RELEVANCE || e.angle.trim() === "") continue;
    const headline = candidates[e.index - 1].titulo;
    const duplicate = selected.some(
      (s) => s.index === e.index || sameStory(candidates[s.index - 1].titulo, headline)
    );
    if (!duplicate) selected.push(e);
  }

  for (const e of evaluations) {
    if (!selected.includes(e)) {
      discarded.push({ headline: candidates[e.index - 1].titulo, relevance: e.relevance, reason: e.reason });
    }
  }

  const created: CuratedNewsResult["created"] = [];
  for (const e of selected) {
    const c = candidates[e.index - 1];
    const requestOptions: RequestOptions = {
      channels: [input.canal],
      quantity: 1,
      objective: "AUTORIDADE",
      period: "ESTA_SEMANA",
      newsHook: {
        headline: c.titulo,
        source: c.fonte,
        link: c.link,
        publishedAt: c.data,
        angle: e.angle,
        topic: c.tema,
      },
    };
    const { id } = await createProjectAndStartWorkflow(
      `Post de autoridade técnica a partir de uma notícia recente do setor: "${c.titulo}".`,
      { requestOptions, title: c.titulo, startWorkflow: false }
    );
    created.push({ projectId: id, headline: c.titulo, relevance: e.relevance, angle: e.angle });
  }

  if (created.length > 0) {
    after(async () => {
      for (const p of created) await runWorkflow(p.projectId);
    });
  }

  return { created, discarded, usedFallback: result.usedFallback };
}
