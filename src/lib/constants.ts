// Tipos de unión que reemplazan a los enums (SQLite no soporta enums de Prisma).

export type Role = "TECHNICIAN" | "MANAGER";

export type SubmissionStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export const ROLE = {
  TECHNICIAN: "TECHNICIAN",
  MANAGER: "MANAGER",
} as const;

export const STATUS = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
