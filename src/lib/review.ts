import { prisma } from "./prisma";
import { notify } from "./notifications";

type ReviewResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

// Lógica compartida para revisar un envío (usada por la revisión individual y
// la activación en lote). Actualiza el estado, registra el evento de auditoría
// y notifica al técnico (in-app + correo si está configurado).
export async function reviewSubmission(opts: {
  submissionId: string;
  action: "approve" | "reject";
  feedback?: string | null;
  manager: { id: string; name: string };
}): Promise<ReviewResult> {
  const feedback = opts.feedback?.trim() || null;

  if (opts.action !== "approve" && opts.action !== "reject") {
    return { ok: false, status: 400, error: "Acción inválida." };
  }
  if (opts.action === "reject" && !feedback) {
    return {
      ok: false,
      status: 400,
      error: "Indica el motivo del rechazo en el feedback.",
    };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: opts.submissionId },
    include: { step: true },
  });
  if (!submission) {
    return { ok: false, status: 404, error: "Envío no encontrado." };
  }

  const newStatus = opts.action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: newStatus,
      feedback,
      reviewedAt: new Date(),
      reviewedById: opts.manager.id,
      events: {
        create: {
          action: newStatus,
          message: feedback,
          actorName: opts.manager.name,
        },
      },
    },
  });

  const dashboardUrl = `${process.env.APP_URL || ""}/dashboard`;
  if (opts.action === "approve") {
    await notify({
      userId: submission.userId,
      type: "APPROVED",
      title: `Paso aprobado: ${submission.step.title}`,
      body: "¡Buen trabajo! Ya puedes continuar con el siguiente paso.",
      ctaLabel: "Ver mi progreso",
      ctaUrl: dashboardUrl,
    });
  } else {
    await notify({
      userId: submission.userId,
      type: "REJECTED",
      title: `Paso rechazado: ${submission.step.title}`,
      body: feedback,
      ctaLabel: "Corregir y reenviar",
      ctaUrl: dashboardUrl,
    });
  }

  return { ok: true };
}
