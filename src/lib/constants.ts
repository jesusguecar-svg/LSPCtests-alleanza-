// Tipos de unión que reemplazan a los enums (SQLite no soporta enums de Prisma).

export type Role = "TECHNICIAN" | "MANAGER" | "DIRECTOR";

export type SubmissionStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export const ROLE = {
  TECHNICIAN: "TECHNICIAN",
  MANAGER: "MANAGER",
  DIRECTOR: "DIRECTOR",
} as const;

export const STATUS = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// Landing por rol tras iniciar sesión.
export function landingPath(role: Role): string {
  if (role === "MANAGER") return "/admin";
  if (role === "DIRECTOR") return "/admin/reports";
  return "/dashboard";
}

// Roles con acceso al área de administración (panel + reportes).
export function canViewAdmin(role: Role): boolean {
  return role === "MANAGER" || role === "DIRECTOR";
}

// Solo el manager puede revisar/aprobar; el director es de solo lectura.
export function canReview(role: Role): boolean {
  return role === "MANAGER";
}
