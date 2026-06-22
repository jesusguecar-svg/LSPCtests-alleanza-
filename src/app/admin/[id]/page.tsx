import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getDict, localizeStep } from "@/lib/i18n";
import { statusMeta, waitingTime, formatDate } from "@/lib/format";
import { canReview, canViewAdmin, type SubmissionStatus } from "@/lib/constants";
import { ReviewActions } from "../review-actions";

export const dynamic = "force-dynamic";

export default async function TechnicianDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  const locale = getLocale();
  const d = getDict(locale);
  const reviewer = canReview(session.role);

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
          {d.detail.back}
        </Link>
      </div>

      <header className="card mb-6 p-5">
        <h1 className="text-xl font-bold">{tech.name}</h1>
        <p className="text-sm text-slate-500">
          {tech.email}
          {tech.phone ? ` · ${tech.phone}` : ""} ·{" "}
          {d.admin.enrolled(formatDate(tech.createdAt, locale))}
        </p>
        <p className="mt-2 text-sm font-medium">
          {d.detail.approvedOf(approved, subs.length)}
        </p>
      </header>

      <div className="space-y-4">
        {subs.map((sub, i) => {
          const meta = statusMeta(sub.status as SubmissionStatus, locale);
          const content = localizeStep(sub.step, locale);
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
                    {d.admin.stepN(sub.step.order)} {content.title}
                  </h2>
                  <p className="text-sm text-slate-500">{content.description}</p>
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
                    <dt className="text-slate-500">{d.detail.submitted}</dt>
                    <dd>
                      {formatDate(sub.submittedAt, locale)} (
                      {waitingTime(sub.submittedAt, locale)})
                    </dd>
                  </div>
                )}
                {sub.reviewedAt && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500">{d.detail.reviewed}</dt>
                    <dd>{formatDate(sub.reviewedAt, locale)}</dd>
                  </div>
                )}
                {sub.note && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500">{d.detail.techNote}</dt>
                    <dd>“{sub.note}”</dd>
                  </div>
                )}
                {sub.feedback && (
                  <div className="flex gap-2 text-red-700">
                    <dt>{d.detail.managerFeedback}</dt>
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
                  {d.common.viewFile}
                  {sub.fileName ? `: ${sub.fileName}` : ""} ↗
                </a>
              )}

              {/* Línea de tiempo (audit trail) */}
              {sub.events.length > 0 && (
                <ol className="mt-4 border-l-2 border-slate-100 pl-4">
                  {sub.events.map((e) => (
                    <li key={e.id} className="relative pb-3 last:pb-0">
                      <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <p className="text-sm font-medium">
                        {d.events[e.action as keyof typeof d.events] ?? e.action}
                        {e.actorName ? ` — ${e.actorName}` : ""}
                      </p>
                      {e.message && (
                        <p className="text-sm text-slate-600">{e.message}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {formatDate(e.createdAt, locale)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              {reviewer && actionable && (
                <ReviewActions submissionId={sub.id} />
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
