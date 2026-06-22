import type { SubmissionStatus } from "./constants";

export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; icon: string; className: string }
> = {
  PENDING: {
    label: "Pendiente",
    icon: "→",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  IN_REVIEW: {
    label: "En revisión",
    icon: "⏳",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "Aprobado",
    icon: "✓",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    label: "Rechazado",
    icon: "✗",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

// "Reloj de espera" en español, a partir de una fecha de envío.
export function waitingTime(since: Date | string | null | undefined): string {
  if (!since) return "";
  const start = new Date(since).getTime();
  const diffMs = Date.now() - start;
  if (diffMs < 0) return "hace un momento";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hace menos de un minuto";
  if (minutes < 60)
    return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
