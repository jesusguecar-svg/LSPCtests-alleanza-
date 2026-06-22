import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_META, waitingTime, formatDate } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/constants";
import { ReviewActions } from "../review-actions";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  SUBMITTED: "Enviado por el técnico",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  RESET: "Reabierto",
  NOTE: "Nota",
};

export default async function TechnicianDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "MANAGER") redirect("/dashboard");

  const tech = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      submissions: {
        include: { step: true, events: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!tech || tech.role !== "TECHNICIAN") notFound();

  // Ordena las submissions por el orden del paso.
  const subs = [...tech.submissions].sort((a, b) => a.step.order - b.step.order);
  const approved = subs.filter((s) => s.status === "APPROVED").length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">
          ← Volver al panel
        </Link>
      </div>

      <header className="card mb-6 p-5">
        <h1 className="text-xl font-bold">{tech.name}</h1>
        <p className="text-sm text-slate-500">
          {tech.email}
          {tech.phone ? ` · ${tech.phone}` : ""} · alta{" "}
          {formatDate(tech.createdAt)}
        </p>
        <p className="mt-2 text-sm font-medium">
          {approved} de {subs.length} pasos aprobados
        </p>
      </header>

      <div className="space-y-4">
        {subs.map((sub, i) => {
          const meta = STATUS_META[sub.status as SubmissionStatus];
          const prev = subs[i - 1];
          const unlocked = i === 0 || prev?.status === "APPROVED";
          const actionable =
            sub.status === "IN_REVIEW" ||
            (sub.step.managerOnly && unlocked && sub.status !== "APPROVED");

          return (
            <section key={sub.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    Paso {sub.step.order}: {sub.step.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {sub.step.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
                >
                  {meta.icon} {meta.label}
                </span>
              </div>

              <dl className="mt-3 space-y-1 text-sm">
                {sub.submittedAt && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Enviado:</dt>
                    <dd>
                      {formatDate(sub.submittedAt)} ({waitingTime(sub.submittedAt)})
                    </dd>
                  </div>
                )}
                {sub.reviewedAt && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Revisado:</dt>
                    <dd>{formatDate(sub.reviewedAt)}</dd>
                  </div>
                )}
                {sub.note && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Nota del técnico:</dt>
                    <dd>“{sub.note}”</dd>
                  </div>
                )}
                {sub.feedback && (
                  <div className="flex gap-2 text-red-700">
                    <dt>Feedback del manager:</dt>
                    <dd>{sub.feedback}</dd>
                  </div>
                )}
              </dl>

              {sub.fileUrl && (
                <a
                  href={`/api/files/${sub.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mt-3"
                >
                  Ver archivo{sub.fileName ? `: ${sub.fileName}` : ""} ↗
                </a>
              )}

              {/* Línea de tiempo (audit trail) */}
              {sub.events.length > 0 && (
                <ol className="mt-4 border-l-2 border-slate-100 pl-4">
                  {sub.events.map((e) => (
                    <li key={e.id} className="relative pb-3 last:pb-0">
                      <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <p className="text-sm font-medium">
                        {EVENT_LABEL[e.action] ?? e.action}
                        {e.actorName ? ` — ${e.actorName}` : ""}
                      </p>
                      {e.message && (
                        <p className="text-sm text-slate-600">{e.message}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {formatDate(e.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              {actionable && <ReviewActions submissionId={sub.id} />}
            </section>
          );
        })}
      </div>
    </main>
  );
}
