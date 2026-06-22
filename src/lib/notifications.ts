import { prisma } from "./prisma";
import { sendEmail, emailLayout } from "./email";

type NotifyInput = {
  userId: string;
  type: "APPROVED" | "REJECTED" | "SUBMITTED";
  title: string;
  body?: string | null;
  // Opcionales para el correo (si se omiten, se usan title/body).
  emailSubject?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

// Crea la notificación in-app y, si Resend está configurado, envía el correo.
export async function notify(input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: input.emailSubject ?? input.title,
      html: emailLayout({
        heading: input.title,
        body: input.body ?? "",
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
      }),
    });
  }

  return notification;
}

// Notifica a todos los managers (p. ej. cuando un técnico envía un paso).
export async function notifyManagers(
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: { id: true, email: true },
  });
  if (!managers.length) return;

  await prisma.notification.createMany({
    data: managers.map((m) => ({
      userId: m.id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
    })),
  });

  const emails = managers.map((m) => m.email).filter(Boolean);
  if (emails.length) {
    await sendEmail({
      to: emails,
      subject: input.emailSubject ?? input.title,
      html: emailLayout({
        heading: input.title,
        body: input.body ?? "",
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
      }),
    });
  }
}
