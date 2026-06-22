import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "../logout-button";
import { StepCard } from "./step-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "MANAGER") redirect("/admin");

  const steps = await prisma.step.findMany({ orderBy: { order: "asc" } });
  const submissions = await prisma.submission.findMany({
    where: { userId: session.userId },
  });
  const byStep = new Map(submissions.map((s) => [s.stepId, s]));

  const total = steps.length;
  const approved = submissions.filter((s) => s.status === "APPROVED").length;
  const pct = total ? Math.round((approved / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hola, {session.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">Tu progreso de onboarding</p>
        </div>
        <LogoutButton />
      </header>

      <section className="card mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {approved} de {total} pasos aprobados
          </span>
          <span className="text-slate-500">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 ? (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            🎉 ¡Felicidades! Completaste todo el onboarding. Ya puedes empezar a
            recolectar pruebas.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Completa cada paso en orden. Tu manager revisará cada envío y te
            dará feedback si algo necesita corrección.
          </p>
        )}
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const submission = byStep.get(step.id);
          const prevStep = steps[i - 1];
          const prevSub = prevStep ? byStep.get(prevStep.id) : undefined;
          const locked = i > 0 && prevSub?.status !== "APPROVED";
          return (
            <StepCard
              key={step.id}
              index={i + 1}
              step={step}
              submission={submission ?? null}
              locked={locked}
            />
          );
        })}
      </div>
    </main>
  );
}
