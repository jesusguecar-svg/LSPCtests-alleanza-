import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Lista las notificaciones del usuario actual (recientes) + conteo no leídas.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: session.userId, read: false },
    }),
  ]);

  return NextResponse.json({ items, unread });
}

// Marca notificaciones como leídas (todas, o una por id).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body?.id?.toString();

  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
