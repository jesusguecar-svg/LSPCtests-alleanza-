import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const CLOUDINARY_ENABLED =
  !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_CLOUD_NAME;

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function uploadToCloudinary(
  file: File,
  userId: string
): Promise<{ fileUrl: string; fileName: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: file.type }), file.name);
  formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "");
  formData.append("folder", `onboarding/${userId}`);
  formData.append(
    "public_id",
    `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const data = (await response.json()) as {
    secure_url: string;
    public_id: string;
  };
  // Almacenamos la URL completa de Cloudinary en fileUrl
  return { fileUrl: data.secure_url, fileName: file.name };
}

async function uploadToLocalStorage(
  file: File,
  userId: string
): Promise<{ fileUrl: string; fileName: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), UPLOAD_DIR, userId);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(file.name).slice(0, 10).replace(/[^.\w]/g, "");
  const stored = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;
  await writeFile(path.join(dir, stored), buffer);

  // fileUrl es una ruta interna relativa (userId/archivo), no una URL pública.
  return { fileUrl: `${userId}/${stored}`, fileName: file.name };
}

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

  if (CLOUDINARY_ENABLED) {
    return uploadToCloudinary(file, userId);
  }

  return uploadToLocalStorage(file, userId);
}
