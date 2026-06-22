import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString() ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Ingresa tu correo y contraseña." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  await createSession({
    userId: user.id,
    role: user.role as Role,
    name: user.name,
  });
  return NextResponse.json({ ok: true, role: user.role });
}
