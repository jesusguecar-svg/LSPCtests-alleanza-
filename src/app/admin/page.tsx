import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getDict, localizeStep } from "@/lib/i18n";
import { statusMeta, waitingTime, formatDate } from "@/lib/format";
import { canReview, canViewAdmin, type SubmissionStatus } from "@/lib/constants";
import { LogoutButton } from "../logout-button";
import { NotificationBell } from "../notification-bell";
import { LanguageToggle } from "../language-toggle";
import { ReviewActions } from "./review-actions";
import { BulkActivation, type ActivationItem } from "./bulk-activation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  const locale = getLocale();
  const d = getDict(locale);
  const reviewer = canReview(session.role);

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

  // Técnicos listos para activar la cuenta (paso "activation" desbloqueado y
  // aún sin aprobar) — alimenta la activación en lote.
  const activationReady: ActivationItem[] = [];

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
      if (
        sub.step.key === "activation" &&
        unlocked &&
        sub.status !== "APPROVED"
      ) {
        activationReady.push({
          submissionId: sub.id,
          techName: tech.name,
          techEmail: tech.email,
        });
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
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/alleanza-mark.svg" alt="Alleanza" className="h-9 w-auto" />
          <div>
            <h1 className="text-xl font-bold">{d.admin.title}</h1>
            <p className="text-sm text-slate-500">{d.admin.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/reports" className="btn-secondary text-sm">
            {d.admin.reports}
          </Link>
          <LanguageToggle />
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold">{totalTechs}</p>
          <p className="text-sm text-slate-500">{d.admin.technicians}</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-amber-600">{queue.length}</p>
          <p className="text-sm text-slate-500">{d.admin.pendingReview}</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">{fullyDone}</p>
          <p className="text-sm text-slate-500">{d.admin.fullyOnboarded}</p>
        </div>
      </section>

      {/* Cola de revisión */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">{d.admin.reviewQueue}</h2>
        {queue.length === 0 ? (
          <p className="card p-5 text-sm text-slate-500">{d.admin.queueEmpty}</p>
        ) : (
          <div className="space-y-3">
            {queue.map(({ tech, submission }) => {
              const stepContent = localizeStep(submission.step, locale);
              return (
                <div key={submission.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{tech.name}</p>
                      <p className="text-sm text-slate-500">{tech.email}</p>
                      <p className="mt-1 text-sm">
                        {d.admin.stepN(submission.step.order)}{" "}
                        <span className="font-medium">{stepContent.title}</span>
                      </p>
                      {submission.submittedAt && (
                        <p className="mt-1 text-sm text-amber-700">
                          {d.admin.waiting(
                            waitingTime(submission.submittedAt, locale)
                          )}
                        </p>
                      )}
                      {submission.note && (
                        <p className="mt-1 text-sm text-slate-600">
                          {d.admin.techNote(submission.note)}
                        </p>
                      )}
                      {submission.step.managerOnly && (
                        <p className="mt-1 text-sm text-slate-500">
                          {d.admin.managerStepHint}
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
                        {d.common.viewFile} ↗
                      </a>
                    )}
                  </div>
                  {reviewer && <ReviewActions submissionId={submission.id} />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activación en lote (solo manager) */}
      {reviewer && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">{d.admin.bulkTitle}</h2>
          <BulkActivation items={activationReady} />
        </section>
      )}

      {/* Resumen del equipo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{d.admin.team}</h2>
        <div className="space-y-3">
          {technicians.length === 0 && (
            <p className="card p-5 text-sm text-slate-500">{d.admin.noTechs}</p>
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
                      {tech.email} · {d.admin.enrolled(formatDate(tech.createdAt, locale))}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {d.admin.approvedCount(approved, steps.length)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {steps.map((step) => {
                    const sub = subByStep.get(step.id);
                    const meta = statusMeta(
                      (sub?.status ?? "PENDING") as SubmissionStatus,
                      locale
                    );
                    return (
                      <span
                        key={step.id}
                        title={localizeStep(step, locale).title}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
                      >
                        {step.order}. {meta.icon}
                      </span>
                    );
                  })}
                  <Link
                    href={`/admin/${tech.id}`}
                    className="ml-auto text-sm font-medium text-brand-600 hover:underline"
                  >
                    {d.admin.viewHistory}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
