import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function saveUpload(
  file: File,
  userId: string
): Promise<{ fileUrl: string; fileName: string }> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato no permitido. Sube una imagen (JPG/PNG) o PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("El archivo supera el límite de 10 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), UPLOAD_DIR, userId);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(file.name).slice(0, 10).replace(/[^.\w]/g, "");
  const stored = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;
  await writeFile(path.join(dir, stored), buffer);

  // fileUrl es una ruta interna relativa (userId/archivo), no una URL pública.
  return { fileUrl: `${userId}/${stored}`, fileName: file.name };
}
