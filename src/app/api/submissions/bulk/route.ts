import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewSubmission } from "@/lib/review";

// Aprobación en lote (p. ej. activar varias cuentas a la vez).
// Body: { ids: string[], action: "approve" }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.filter((x: unknown) => typeof x === "string")
    : [];
  const action = body?.action === "reject" ? "reject" : "approve";

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No se seleccionó ningún elemento." },
      { status: 400 }
    );
  }

  let approved = 0;
  const errors: string[] = [];
  // Secuencial para no saturar la base/SMTP con equipos pequeños.
  for (const id of ids) {
    const result = await reviewSubmission({
      submissionId: id,
      action,
      manager: { id: session.userId, name: session.name },
    });
    if (result.ok) approved += 1;
    else errors.push(`${id}: ${result.error}`);
  }

  return NextResponse.json({ ok: true, approved, failed: errors.length });
}
