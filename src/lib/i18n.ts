// Diccionarios ES/EN. Módulo puro (sin next/headers) para que pueda importarse
// tanto en componentes de servidor como de cliente.

export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";
export const LANG_COOKIE = "lang";

const es = {
  common: {
    appName: "Panel de Onboarding",
    appTagline: "Programa de telemedicina y pruebas diagnósticas",
    logout: "Cerrar sesión",
    cancel: "Cancelar",
    loading: "Procesando...",
    openLink: "Abrir enlace ↗",
    viewFile: "Ver archivo",
    language: "Idioma",
  },
  status: {
    PENDING: "Pendiente",
    IN_REVIEW: "En revisión",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
  },
  events: {
    SUBMITTED: "Enviado por el técnico",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    RESET: "Reabierto",
    NOTE: "Nota",
  },
  auth: {
    loginTitle: "Iniciar sesión",
    registerTitle: "Crea tu cuenta",
    registerSubtitle: "Empieza tu proceso de onboarding como técnico",
    name: "Nombre completo",
    phone: "Teléfono (opcional)",
    email: "Correo",
    password: "Contraseña",
    signIn: "Entrar",
    createAccount: "Crear cuenta",
    newTech: "¿Eres técnico nuevo?",
    createHere: "Crea tu cuenta",
    haveAccount: "¿Ya tienes cuenta?",
    signInHere: "Inicia sesión",
    demoNote:
      "Cuentas demo — Manager: manager@lspc.test / manager123 · Técnico: tecnico@lspc.test / tecnico123",
    genericError: "Ocurrió un error. Inténtalo de nuevo.",
  },
  dashboard: {
    greeting: (name: string) => `Hola, ${name}`,
    subtitle: "Tu progreso de onboarding",
    approvedOf: (a: number, t: number) => `${a} de ${t} pasos aprobados`,
    allDone:
      "🎉 ¡Felicidades! Completaste todo el onboarding. Ya puedes empezar a recolectar pruebas.",
    helper:
      "Completa cada paso en orden. Tu manager revisará cada envío y te dará feedback si algo necesita corrección.",
  },
  step: {
    inReviewSince: (t: string) => `⏳ En revisión desde ${t}.`,
    rejectionReason: "Motivo del rechazo:",
    approved: "✓ Paso aprobado.",
    locked: "🔒 Completa el paso anterior para desbloquear este.",
    managerWillDo:
      "Este paso lo completa tu manager. Te avisaremos cuando esté listo.",
    complete: "Completar paso",
    fixResend: "Corregir y reenviar",
    instructions: "Instrucciones:",
    fileLabel: "Archivo (imagen o PDF, máx 10 MB)",
    noteLabel: "Nota para el manager (opcional)",
    submit: "Enviar para revisión",
    sending: "Enviando...",
    submitError: "No se pudo enviar.",
  },
  admin: {
    title: "Panel del Manager",
    subtitle: "Revisa envíos y gestiona el onboarding del equipo",
    technicians: "Técnicos",
    pendingReview: "Pendientes de revisar",
    fullyOnboarded: "Onboarding completo",
    reviewQueue: "Cola de revisión",
    queueEmpty: "No hay envíos pendientes. ¡Todo al día! ✅",
    stepN: (n: number) => `Paso ${n}:`,
    waiting: (t: string) => `⏳ Esperando ${t}`,
    techNote: (n: string) => `Nota del técnico: “${n}”`,
    managerStepHint:
      "Paso de manager — aprueba cuando el técnico esté listo.",
    team: "Equipo",
    noTechs: "Aún no hay técnicos registrados.",
    approvedCount: (a: number, t: number) => `${a}/${t} aprobados`,
    enrolled: (d: string) => `alta ${d}`,
    viewHistory: "Ver historial →",
    approve: "Aprobar",
    reject: "Rechazar",
    confirmReject: "Confirmar rechazo",
    rejectPlaceholder:
      "Motivo del rechazo e instrucciones para corregir...",
    rejectNeedsReason: "Escribe el motivo del rechazo.",
    actionError: "No se pudo procesar.",
  },
  detail: {
    back: "← Volver al panel",
    submitted: "Enviado:",
    reviewed: "Revisado:",
    techNote: "Nota del técnico:",
    managerFeedback: "Feedback del manager:",
    approvedOf: (a: number, t: number) => `${a} de ${t} pasos aprobados`,
  },
  notif: {
    title: "Notificaciones",
    empty: "No tienes notificaciones.",
    ariaLabel: "Notificaciones",
  },
  time: {
    justNow: "ahora",
    lessThanMinute: "hace menos de un minuto",
    minutes: (n: number) => `hace ${n} ${n === 1 ? "minuto" : "minutos"}`,
    hours: (n: number) => `hace ${n} ${n === 1 ? "hora" : "horas"}`,
    days: (n: number) => `hace ${n} ${n === 1 ? "día" : "días"}`,
    minShort: (n: number) => `hace ${n} min`,
    hShort: (n: number) => `hace ${n} h`,
    dShort: (n: number) => `hace ${n} d`,
    dash: "—",
  },
};

type Dict = typeof es;

const en: Dict = {
  common: {
    appName: "Onboarding Dashboard",
    appTagline: "Telemedicine and diagnostic testing program",
    logout: "Log out",
    cancel: "Cancel",
    loading: "Processing...",
    openLink: "Open link ↗",
    viewFile: "View file",
    language: "Language",
  },
  status: {
    PENDING: "Pending",
    IN_REVIEW: "In review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  },
  events: {
    SUBMITTED: "Submitted by technician",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    RESET: "Reopened",
    NOTE: "Note",
  },
  auth: {
    loginTitle: "Sign in",
    registerTitle: "Create your account",
    registerSubtitle: "Start your onboarding process as a technician",
    name: "Full name",
    phone: "Phone (optional)",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    createAccount: "Create account",
    newTech: "New technician?",
    createHere: "Create your account",
    haveAccount: "Already have an account?",
    signInHere: "Sign in",
    demoNote:
      "Demo accounts — Manager: manager@lspc.test / manager123 · Technician: tecnico@lspc.test / tecnico123",
    genericError: "Something went wrong. Please try again.",
  },
  dashboard: {
    greeting: (name: string) => `Hi, ${name}`,
    subtitle: "Your onboarding progress",
    approvedOf: (a: number, t: number) => `${a} of ${t} steps approved`,
    allDone:
      "🎉 Congratulations! You completed the entire onboarding. You can start collecting tests.",
    helper:
      "Complete each step in order. Your manager will review each submission and give you feedback if something needs fixing.",
  },
  step: {
    inReviewSince: (t: string) => `⏳ In review since ${t}.`,
    rejectionReason: "Rejection reason:",
    approved: "✓ Step approved.",
    locked: "🔒 Complete the previous step to unlock this one.",
    managerWillDo:
      "Your manager completes this step. We'll let you know when it's ready.",
    complete: "Complete step",
    fixResend: "Fix and resubmit",
    instructions: "Instructions:",
    fileLabel: "File (image or PDF, max 10 MB)",
    noteLabel: "Note for the manager (optional)",
    submit: "Submit for review",
    sending: "Sending...",
    submitError: "Could not submit.",
  },
  admin: {
    title: "Manager Dashboard",
    subtitle: "Review submissions and manage your team's onboarding",
    technicians: "Technicians",
    pendingReview: "Pending review",
    fullyOnboarded: "Fully onboarded",
    reviewQueue: "Review queue",
    queueEmpty: "No pending submissions. All caught up! ✅",
    stepN: (n: number) => `Step ${n}:`,
    waiting: (t: string) => `⏳ Waiting ${t}`,
    techNote: (n: string) => `Technician note: “${n}”`,
    managerStepHint: "Manager step — approve when the technician is ready.",
    team: "Team",
    noTechs: "No technicians registered yet.",
    approvedCount: (a: number, t: number) => `${a}/${t} approved`,
    enrolled: (d: string) => `joined ${d}`,
    viewHistory: "View history →",
    approve: "Approve",
    reject: "Reject",
    confirmReject: "Confirm rejection",
    rejectPlaceholder: "Rejection reason and instructions to fix...",
    rejectNeedsReason: "Write the rejection reason.",
    actionError: "Could not process.",
  },
  detail: {
    back: "← Back to dashboard",
    submitted: "Submitted:",
    reviewed: "Reviewed:",
    techNote: "Technician note:",
    managerFeedback: "Manager feedback:",
    approvedOf: (a: number, t: number) => `${a} of ${t} steps approved`,
  },
  notif: {
    title: "Notifications",
    empty: "You have no notifications.",
    ariaLabel: "Notifications",
  },
  time: {
    justNow: "just now",
    lessThanMinute: "less than a minute ago",
    minutes: (n: number) => `${n} ${n === 1 ? "minute" : "minutes"} ago`,
    hours: (n: number) => `${n} ${n === 1 ? "hour" : "hours"} ago`,
    days: (n: number) => `${n} ${n === 1 ? "day" : "days"} ago`,
    minShort: (n: number) => `${n} min ago`,
    hShort: (n: number) => `${n}h ago`,
    dShort: (n: number) => `${n}d ago`,
    dash: "—",
  },
};

const DICTS: Record<Locale, Dict> = { es, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? es;
}

export type Dictionary = Dict;

// Selecciona el contenido del paso según el idioma (con fallback al español).
export function localizeStep(
  step: {
    title: string;
    description: string;
    instructions: string;
    titleEn?: string | null;
    descriptionEn?: string | null;
    instructionsEn?: string | null;
  },
  locale: Locale
) {
  if (locale === "en") {
    return {
      title: step.titleEn || step.title,
      description: step.descriptionEn || step.description,
      instructions: step.instructionsEn || step.instructions,
    };
  }
  return {
    title: step.title,
    description: step.description,
    instructions: step.instructions,
  };
}

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}
