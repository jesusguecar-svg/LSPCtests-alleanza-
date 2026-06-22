import { prisma } from "./prisma";

type NotifyInput = {
  userId: string;
  type: "APPROVED" | "REJECTED" | "SUBMITTED";
  title: string;
  body?: string | null;
};

export async function notify(input: NotifyInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
    },
  });
}

// Notifica a todos los managers (p. ej. cuando un técnico envía un paso).
export async function notifyManagers(
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: { id: true },
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
}
