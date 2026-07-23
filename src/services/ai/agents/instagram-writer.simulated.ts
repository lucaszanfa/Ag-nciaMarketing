import { dedupe, pickOne } from "@/lib/random";
import type { InstagramWriterInput } from "./instagram-writer.agent";
import type {
  InstagramCarousel,
  InstagramPost,
  InstagramReels,
  InstagramStory,
  InstagramWriterOutput,
} from "../schemas/instagram-writer.schema";
import type { ContentPlanItem } from "../schemas/chief-editor.schema";
import type { RevisionInput } from "../types";
import type { InstagramContent } from "../prompts/instagram-writer-revision.prompt";

const COVERS = [
  "Capa com título em destaque sobre fundo da paleta da marca",
  "Capa com foto de bastidores e overlay de texto",
  "Capa minimalista com ícone e frase de impacto",
];

const VISUALS = [
  "Fotos reais da equipe/produto, cores da marca",
  "Ilustração flat com paleta da marca",
  "Mockup do produto/serviço em uso",
];

const INTERACTION_TYPES = ["Enquete", "Caixa de perguntas", "Contador regressivo", "Figurinha de link"];

function hashtagsFor(input: InstagramWriterInput): string[] {
  return dedupe([`#${input.company.companyName.replace(/\s+/g, "")}`, ...input.company.hashtags.slice(0, 3)].filter(Boolean));
}

function buildCarousel(brief: ContentPlanItem, input: InstagramWriterInput): InstagramCarousel {
  return {
    briefId: brief.id,
    internalTitle: `Carrossel — ${brief.theme}`,
    cover: pickOne(COVERS),
    slides: [
      { order: 1, title: "O problema", text: `${brief.theme}: por onde começar?` },
      { order: 2, title: "Nosso ponto de vista", text: `Na ${input.company.companyName}, isso faz parte do nosso dia a dia.` },
      { order: 3, title: "Na prática", text: brief.briefing },
      { order: 4, title: "Próximo passo", text: input.plan.primaryCta },
    ],
    caption: `Vamos falar sobre ${brief.theme.toLowerCase()}? Arraste para o lado e conta pra gente o que achou. 👉`,
    cta: input.plan.primaryCta,
    hashtags: hashtagsFor(input),
    visualSuggestion: pickOne(VISUALS),
  };
}

function buildReels(brief: ContentPlanItem, input: InstagramWriterInput): InstagramReels {
  return {
    briefId: brief.id,
    internalTitle: `Reels — ${brief.theme}`,
    hook: "Pergunta direta para prender atenção nos primeiros segundos",
    estimatedDuration: "15s",
    script: [
      {
        moment: "0-3s",
        description: "Gancho",
        narration: `Você sabia que ${brief.theme.toLowerCase()} pode mudar o seu resultado?`,
        onScreenText: brief.theme,
      },
      {
        moment: "3-12s",
        description: "Desenvolvimento",
        narration: `Na ${input.company.companyName}, resolvemos isso assim: ${brief.briefing}`,
        onScreenText: "Como fazemos isso",
      },
      {
        moment: "12-15s",
        description: "Fechamento",
        narration: input.plan.primaryCta,
        onScreenText: input.plan.primaryCta,
      },
    ],
    caption: `${brief.theme} em 15 segundos. Comenta aqui embaixo se você já passou por isso.`,
    cta: input.plan.primaryCta,
    hashtags: dedupe([...hashtagsFor(input), "#Reels"]),
    visualSuggestion: pickOne(VISUALS),
  };
}

function buildPost(brief: ContentPlanItem, input: InstagramWriterInput): InstagramPost {
  return {
    briefId: brief.id,
    internalTitle: `Post — ${brief.theme}`,
    theme: brief.theme,
    objective: brief.objective,
    caption: `Um resumo rápido sobre ${brief.theme.toLowerCase()} para quem acompanha a ${input.company.companyName}.`,
    cta: input.plan.primaryCta,
    hashtags: hashtagsFor(input),
    visualSuggestion: pickOne(VISUALS),
  };
}

function buildStory(brief: ContentPlanItem, input: InstagramWriterInput): InstagramStory {
  const screens = [
    { order: 1, text: `Enquete rápida sobre ${brief.theme.toLowerCase()}`, interactionType: pickOne(INTERACTION_TYPES) },
    { order: 2, text: "Bastidor do conteúdo relacionado", interactionType: "Nenhuma" },
    { order: 3, text: input.plan.primaryCta, interactionType: "Figurinha de link" },
  ];
  return {
    briefId: brief.id,
    internalTitle: `Stories de apoio — ${brief.theme}`,
    screens,
    frames: screens.map((s) => s.text),
    cta: input.plan.primaryCta,
    visualSuggestion: pickOne(VISUALS),
  };
}

export function generateSimulatedInstagramContent(input: InstagramWriterInput): InstagramWriterOutput {
  const briefs = input.briefs;
  const fallbackTheme = input.plan.contentPlan[0]?.theme ?? "Novidades da empresa";
  const fallbackBrief: ContentPlanItem = {
    id: "ig-fallback-1",
    platform: "INSTAGRAM",
    format: "CAROUSEL",
    theme: fallbackTheme,
    objective: input.plan.objective,
    briefing: input.plan.summary,
    suggestedDate: new Date().toISOString().slice(0, 10),
  };

  const byFormat = briefs.length > 0 ? briefs : [fallbackBrief];

  return {
    carousels: byFormat.filter((b) => b.format === "CAROUSEL").map((b) => buildCarousel(b, input)),
    reels: byFormat.filter((b) => b.format === "REELS").map((b) => buildReels(b, input)),
    posts: byFormat.filter((b) => b.format === "POST").map((b) => buildPost(b, input)),
    stories: byFormat.filter((b) => b.format === "STORIES").map((b) => buildStory(b, input)),
  };
}

/** Simulated correction: reacts to the Reviewer's feedback per format instead of echoing it back. */
export function generateSimulatedInstagramRevision(input: RevisionInput<InstagramContent>): InstagramContent {
  const { review, originalContent, revisionAttempt } = input;
  const note = `Correção simulada (tentativa ${revisionAttempt})${review.problems.length ? `: ${review.problems.join("; ")}` : ""}.`;
  const cta = review.ctaScore < 85 ? `${input.editorialPlan.primaryCta} — não perca essa oportunidade` : originalContent.cta;
  const visualSuggestion = pickOne(VISUALS.filter((v) => v !== originalContent.visualSuggestion)) || originalContent.visualSuggestion;

  if (input.format === "CAROUSEL") {
    const carousel = originalContent as InstagramCarousel;
    return {
      ...carousel,
      cta,
      visualSuggestion,
      caption: review.suggestions.length ? `${carousel.caption}\n\n${review.suggestions[0]}` : carousel.caption,
      slides: [...carousel.slides, { order: carousel.slides.length + 1, title: "Ajuste", text: note }],
    };
  }
  if (input.format === "REELS") {
    const reels = originalContent as InstagramReels;
    return {
      ...reels,
      cta,
      visualSuggestion,
      hook: review.problems.length ? `${reels.hook} (revisado)` : reels.hook,
      caption: review.suggestions.length ? `${reels.caption}\n\n${review.suggestions[0]}` : reels.caption,
    };
  }
  if (input.format === "STORIES") {
    const story = originalContent as InstagramStory;
    const screens = [...story.screens, { order: story.screens.length + 1, text: note, interactionType: "Nenhuma" }];
    return { ...story, cta, visualSuggestion, screens, frames: screens.map((s) => s.text) };
  }

  const post = originalContent as InstagramPost;
  return {
    ...post,
    cta,
    visualSuggestion,
    caption: review.suggestions.length ? `${post.caption}\n\n${review.suggestions[0]}` : `${post.caption}\n\n${note}`,
  };
}
