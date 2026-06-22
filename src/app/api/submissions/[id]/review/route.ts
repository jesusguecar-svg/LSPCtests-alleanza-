import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// El manager aprueba o rechaza una submission (con feedback).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action?.toString(); // "approve" | "reject"
  const feedback = body?.feedback?.toString().trim() || null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }
  if (action === "reject" && !feedback) {
    return NextResponse.json(
      { error: "Indica el motivo del rechazo en el feedback." },
      { status: 400 }
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
  });
  if (!submission) {
    return NextResponse.json(
      { error: "Envío no encontrado." },
      { status: 404 }
    );
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: newStatus,
      feedback,
      reviewedAt: new Date(),
      reviewedById: session.userId,
      events: {
        create: {
          action: action === "approve" ? "APPROVED" : "REJECTED",
          message: feedback,
          actorName: session.name,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
