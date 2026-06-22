import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import pathLib from "path";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

// Sirve archivos privados. Solo el dueño o un manager pueden acceder.
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const segments = params.path ?? [];
  const ownerId = segments[0];

  // Evita path traversal.
  if (segments.some((s) => s.includes("..") || s.includes("/"))) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  if (session.role !== "MANAGER" && session.userId !== ownerId) {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  const relative = segments.join("/");
  // Verifica que el archivo corresponda a una submission real.
  const submission = await prisma.submission.findFirst({
    where: { fileUrl: relative },
  });
  if (!submission) {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 }
    );
  }

  // Si fileUrl es una URL absoluta (Cloudinary), redirige
  if (submission.fileUrl?.startsWith("https://")) {
    return NextResponse.redirect(submission.fileUrl);
  }

  // Si no, sirve del almacenamiento local
  try {
    const filePath = pathLib.join(process.cwd(), UPLOAD_DIR, relative);
    const data = await readFile(filePath);
    const ext = pathLib.extname(filePath).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 }
    );
  }
}
