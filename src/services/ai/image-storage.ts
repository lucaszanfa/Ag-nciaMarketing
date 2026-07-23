import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGES_DIR = path.join(process.cwd(), "public", "generated-images");

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Writes a generated image under `public/generated-images/` and returns its public URL path. */
export async function saveContentImage(contentId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "png";
  const fileName = `${contentId}.${extension}`;

  await mkdir(IMAGES_DIR, { recursive: true });
  await writeFile(path.join(IMAGES_DIR, fileName), buffer);

  return `/generated-images/${fileName}`;
}
