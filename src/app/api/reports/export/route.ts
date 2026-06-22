import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canViewAdmin } from "@/lib/constants";

function csvCell(value: string): string {
  // Escapa comillas y envuelve si hay comas/saltos/comillas.
  const v = value ?? "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

// Exporta el estado de onboarding de todos los técnicos como CSV.
export async function GET() {
  const session = await getSession();
  if (!session || !canViewAdmin(session.role)) {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  const steps = await prisma.step.findMany({ orderBy: { order: "asc" } });
  const techs = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    orderBy: { createdAt: "asc" },
    include: { submissions: true },
  });

  const header = [
    "Nombre",
    "Email",
    "Telefono",
    "Alta",
    ...steps.map((s) => `${s.order}. ${s.title}`),
    "% Aprobado",
  ];

  const rows = techs.map((t) => {
    const byStep = new Map(t.submissions.map((s) => [s.stepId, s.status]));
    const statuses = steps.map((s) => byStep.get(s.id) ?? "PENDING");
    const approved = statuses.filter((s) => s === "APPROVED").length;
    const pct = steps.length
      ? Math.round((approved / steps.length) * 100)
      : 0;
    return [
      t.name,
      t.email,
      t.phone ?? "",
      new Date(t.createdAt).toISOString().slice(0, 10),
      ...statuses,
      `${pct}%`,
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((c) => csvCell(String(c))).join(","))
    .join("\n");

  const filename = `onboarding-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
