import type { SubmissionStatus } from "./constants";
import { getDict, type Locale } from "./i18n";

const STATUS_STYLE: Record<
  SubmissionStatus,
  { icon: string; className: string }
> = {
  PENDING: {
    icon: "→",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  IN_REVIEW: {
    icon: "⏳",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    icon: "✓",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    icon: "✗",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function statusMeta(status: SubmissionStatus, locale: Locale) {
  const d = getDict(locale);
  return { ...STATUS_STYLE[status], label: d.status[status] };
}

// "Reloj de espera" localizado, a partir de una fecha de envío.
export function waitingTime(
  since: Date | string | null | undefined,
  locale: Locale
): string {
  if (!since) return "";
  const t = getDict(locale).time;
  const start = new Date(since).getTime();
  const diffMs = Date.now() - start;
  if (diffMs < 0) return t.justNow;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t.lessThanMinute;
  if (minutes < 60) return t.minutes(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hours(hours);

  const days = Math.floor(hours / 24);
  return t.days(days);
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale
): string {
  if (!date) return getDict(locale).time.dash;
  return new Date(date).toLocaleString(locale === "en" ? "en-US" : "es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
