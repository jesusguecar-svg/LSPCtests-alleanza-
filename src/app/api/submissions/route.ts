import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import { notifyManagers } from "@/lib/notifications";

// El técnico envía un paso (con archivo opcional + nota). Pasa a IN_REVIEW.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const formData = await req.formData();
  const stepId = formData.get("stepId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;
  const file = formData.get("file");

  if (!stepId) {
    return NextResponse.json({ error: "Falta el paso." }, { status: 400 });
  }

  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step) {
    return NextResponse.json({ error: "Paso no encontrado." }, { status: 404 });
  }
  if (step.managerOnly) {
    return NextResponse.json(
      { error: "Este paso lo completa tu manager." },
      { status: 403 }
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { userId_stepId: { userId: session.userId, stepId } },
  });
  if (!submission) {
    return NextResponse.json(
      { error: "No tienes este paso asignado." },
      { status: 404 }
    );
  }
  if (submission.status === "APPROVED") {
    return NextResponse.json(
      { error: "Este paso ya fue aprobado." },
      { status: 409 }
    );
  }

  let fileUrl = submission.fileUrl;
  let fileName = submission.fileName;

  if (file && file instanceof File && file.size > 0) {
    try {
      const saved = await saveUpload(file, session.userId);
      fileUrl = saved.fileUrl;
      fileName = saved.fileName;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Error al subir archivo." },
        { status: 400 }
      );
    }
  }

  if (step.requiresUpload && !fileUrl) {
    return NextResponse.json(
      { error: "Este paso requiere subir un archivo." },
      { status: 400 }
    );
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: "IN_REVIEW",
      fileUrl,
      fileName,
      note,
      submittedAt: new Date(),
      // limpia feedback previo al reenviar
      feedback: null,
      reviewedAt: null,
      reviewedById: null,
      events: {
        create: {
          action: "SUBMITTED",
          message: note,
          actorName: session.name,
        },
      },
    },
  });

  await notifyManagers({
    type: "SUBMITTED",
    title: `Nuevo envío por revisar: ${step.title}`,
    body: `${session.name} envió el paso "${step.title}".`,
    ctaLabel: "Ir a la cola de revisión",
    ctaUrl: `${process.env.APP_URL || ""}/admin`,
  });

  return NextResponse.json({ ok: true });
}
