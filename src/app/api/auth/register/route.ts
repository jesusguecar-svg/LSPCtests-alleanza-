import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.toString().trim();
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString() ?? "";
  const phone = body?.phone?.toString().trim() || null;

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      {
        error:
          "Completa nombre, correo y una contraseña de al menos 6 caracteres.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone, role: "TECHNICIAN" },
  });

  // Crea una fila de submission por cada paso para el nuevo técnico.
  const steps = await prisma.step.findMany();
  if (steps.length) {
    await prisma.submission.createMany({
      data: steps.map((s) => ({ userId: user.id, stepId: s.id })),
    });
  }

  await createSession({
    userId: user.id,
    role: user.role as Role,
    name: user.name,
  });
  return NextResponse.json({ ok: true, role: user.role });
}
