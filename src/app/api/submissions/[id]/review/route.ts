import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewSubmission } from "@/lib/review";

// El manager aprueba o rechaza una submission (con feedback).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action?.toString();
  const feedback = body?.feedback?.toString() ?? null;

  const result = await reviewSubmission({
    submissionId: params.id,
    action,
    feedback,
    manager: { id: session.userId, name: session.name },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
