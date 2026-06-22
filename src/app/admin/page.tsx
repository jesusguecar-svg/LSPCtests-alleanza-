import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "../logout-button";
import { STATUS_META, waitingTime, formatDate } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/constants";
import { ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "MANAGER") redirect("/dashboard");

  const steps = await prisma.step.findMany({ orderBy: { order: "asc" } });
  const stepOrder = new Map(steps.map((s) => [s.id, s.order]));

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    orderBy: { createdAt: "asc" },
    include: {
      submissions: { include: { step: true } },
    },
  });

  // Cola de revisión: enviados por técnicos (IN_REVIEW) + pasos del manager
  // desbloqueados que aún no se aprueban.
  const queue: {
    tech: (typeof technicians)[number];
    submission: (typeof technicians)[number]["submissions"][number];
  }[] = [];

  for (const tech of technicians) {
    const byOrder = [...tech.submissions].sort(
      (a, b) => (stepOrder.get(a.stepId) ?? 0) - (stepOrder.get(b.stepId) ?? 0)
    );
    for (let i = 0; i < byOrder.length; i++) {
      const sub = byOrder[i];
      const prev = byOrder[i - 1];
      const unlocked = i === 0 || prev?.status === "APPROVED";
      const isManagerActionable =
        sub.step.managerOnly && unlocked && sub.status !== "APPROVED";
      if (sub.status === "IN_REVIEW" || isManagerActionable) {
        queue.push({ tech, submission: sub });
      }
    }
  }

  const totalTechs = technicians.length;
  const fullyDone = technicians.filter((t) =>
    t.submissions.length
      ? t.submissions.every((s) => s.status === "APPROVED")
      : false
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Panel del Manager</h1>
          <p className="text-sm text-slate-500">
            Revisa envíos y gestiona el onboarding del equipo
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mb-8 grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold">{totalTechs}</p>
          <p className="text-sm text-slate-500">Técnicos</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-amber-600">{queue.length}</p>
          <p className="text-sm text-slate-500">Pendientes de revisar</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">{fullyDone}</p>
          <p className="text-sm text-slate-500">Onboarding completo</p>
        </div>
      </section>

      {/* Cola de revisión */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Cola de revisión</h2>
        {queue.length === 0 ? (
          <p className="card p-5 text-sm text-slate-500">
            No hay envíos pendientes. ¡Todo al día! ✅
          </p>
        ) : (
          <div className="space-y-3">
            {queue.map(({ tech, submission }) => (
              <div key={submission.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{tech.name}</p>
                    <p className="text-sm text-slate-500">{tech.email}</p>
                    <p className="mt-1 text-sm">
                      Paso {submission.step.order}:{" "}
                      <span className="font-medium">{submission.step.title}</span>
                    </p>
                    {submission.submittedAt && (
                      <p className="mt-1 text-sm text-amber-700">
                        ⏳ Esperando {waitingTime(submission.submittedAt)}
                      </p>
                    )}
                    {submission.note && (
                      <p className="mt-1 text-sm text-slate-600">
                        Nota del técnico: “{submission.note}”
                      </p>
                    )}
                    {submission.step.managerOnly && (
                      <p className="mt-1 text-sm text-slate-500">
                        Paso de manager — aprueba cuando el técnico esté listo.
                      </p>
                    )}
                  </div>
                  {submission.fileUrl && (
                    <a
                      href={`/api/files/${submission.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Ver archivo ↗
                    </a>
                  )}
                </div>
                <ReviewActions submissionId={submission.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resumen del equipo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Equipo</h2>
        <div className="space-y-3">
          {technicians.length === 0 && (
            <p className="card p-5 text-sm text-slate-500">
              Aún no hay técnicos registrados.
            </p>
          )}
          {technicians.map((tech) => {
            const subByStep = new Map(
              tech.submissions.map((s) => [s.stepId, s])
            );
            const approved = tech.submissions.filter(
              (s) => s.status === "APPROVED"
            ).length;
            return (
              <div key={tech.id} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tech.name}</p>
                    <p className="text-sm text-slate-500">
                      {tech.email} · alta {formatDate(tech.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {approved}/{steps.length} aprobados
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {steps.map((step) => {
                    const sub = subByStep.get(step.id);
                    const meta =
                      STATUS_META[
                        (sub?.status ?? "PENDING") as SubmissionStatus
                      ];
                    return (
                      <span
                        key={step.id}
                        title={step.title}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
                      >
                        {step.order}. {meta.icon}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
