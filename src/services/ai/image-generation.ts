import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash-image";

const STYLE_PREAMBLE =
  "Gere uma imagem fotográfica ou ilustrativa, sem nenhum texto, letra, palavra ou " +
  "legenda escrita dentro da imagem, para uso em post de mídia social. Descrição da cena: ";

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Real image generation via Gemini's free-tier "Nano Banana" model — a
 * capability independent of `AI_PROVIDER` (the text-model selection), gated
 * only by `GEMINI_API_KEY` being set. Returns `null` (never throws) when the
 * key is missing or on any API error, so a failed/unavailable image never
 * blocks the surrounding content-generation workflow.
 */
export async function generateContentImage(prompt: string, aspectRatio?: string): Promise<GeneratedImage | null> {
  if (!process.env.GEMINI_API_KEY?.trim()) return null;

  try {
    const client = new GoogleGenAI({});
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: STYLE_PREAMBLE + prompt }] }],
      config: {
        imageConfig: aspectRatio ? { aspectRatio } : undefined,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) return null;

    return {
      buffer: Buffer.from(imagePart.inlineData.data, "base64"),
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
    };
  } catch (error) {
    console.error("[image-generation] failed to generate content image:", error);
    return null;
  }
}
