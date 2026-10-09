/**
 * Writing rules shared by every writer (and checked by the Reviewer). Small local models
 * (e.g. Gemma via LM Studio) fall back on the same handful of AI clichés unless told
 * explicitly what to avoid — so the list below is concrete on purpose.
 */
export const WRITING_QUALITY_RULES = `Writing quality (mandatory):
- Be specific. Every post must contain at least one concrete, technically correct insight that a
  practitioner in the audience would recognize (a real risk, a real step of a process, a real
  trade-off). Generic statements that would fit any company in any industry are not acceptable.
- Only use facts that were given to you (company context, briefing, news headline). Never invent
  numbers, percentages, client names, project names, dates or quotes.
- Short paragraphs (1-3 sentences). Plain, direct Portuguese. Active voice.
- Maximum 2 emojis per piece, and none in the first line. Never use emojis as bullet points.
- Never use these clichés (or close variations): "não é apenas X, é Y" / "mais do que X, é Y",
  "no cenário atual", "no mundo de hoje", "cada vez mais", "um excelente exemplo",
  "não é segredo que", "em um mundo onde", "jornada", "potencializar", "alavancar",
  "fazer a diferença", "elevar ao próximo nível", "sinergia", "disruptivo", "game changer",
  "vamos juntos", "fique por dentro".
- Never tell the reader to "deslizar"/"arrastar"/"ver os slides" unless the piece IS a carousel.
- The CTA must be one single, concrete action, consistent with the company's default CTA.`;

/** One line every prompt includes so the model can reason about dates. */
export function todayLine(today: string): string {
  return `Today is ${today}. Use it to resolve relative dates ("próxima semana", "este mês") and never suggest dates in the past.`;
}
