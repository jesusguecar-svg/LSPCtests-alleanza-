import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { getDict, localizeStep, type Locale } from "@/lib/i18n";
import { canViewAdmin } from "@/lib/constants";
import { computeAnalytics, type Analytics } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { formatDate, statusMeta } from "@/lib/format";
import { type SubmissionStatus } from "@/lib/constants";
import { LogoutButton } from "../../logout-button";
import { LanguageToggle } from "../../language-toggle";
import { NotificationBell } from "../../notification-bell";

export const dynamic = "force-dynamic";

// ─── helpers ────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function avgLabel(ms: number | null, locale: Locale): string {
  if (ms == null) return "—";
  const hours = ms / 3_600_000;
  if (hours >= 48) return `${(hours / 24).toFixed(1)} ${locale === "en" ? "days" : "días"}`;
  return `${Math.max(1, Math.round(hours))} ${locale === "en" ? "hrs" : "hrs"}`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  value,
  label,
  sub,
  color = "text-slate-900",
  bg = "bg-white",
  icon,
}: {
  value: string | number;
  label: string;
  sub?: string;
  color?: string;
  bg?: string;
  icon: string;
}) {
  return (
    <div className={`card p-5 ${bg}`}>
      <div className="mb-3 text-2xl">{icon}</div>
      <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function DonutChart({ a }: { a: Analytics }) {
  const total = a.totalTechs || 1;
  const completedDeg = (a.completed / total) * 360;
  const inProgressDeg = (a.inProgress / total) * 360;
  const notStartedDeg = (a.notStarted / total) * 360;

  const c1 = completedDeg;
  const c2 = c1 + inProgressDeg;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const c3 = c2 + notStartedDeg;

  const gradient =
    a.totalTechs === 0
      ? "conic-gradient(#e2e8f0 0deg 360deg)"
      : `conic-gradient(
          #22c55e 0deg ${c1}deg,
          #0891b2 ${c1}deg ${c2}deg,
          #94a3b8 ${c2}deg 360deg
        )`;

  return (
    <div
      className="relative mx-auto h-44 w-44 rounded-full"
      style={{ background: gradient }}
    >
      <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
        <span className="text-2xl font-bold text-slate-900">{a.totalTechs}</span>
        <span className="text-xs text-slate-500">total</span>
      </div>
    </div>
  );
}

function FunnelBar({ f, locale }: { f: Analytics["funnel"][number]; locale: Locale }) {
  const total = f.total || 1;
  const approvedW = pct(f.approved, total);
  const inReviewW = pct(f.inReview, total);
  const rejectedW = pct(f.rejected, total);
  const pendingW = Math.max(0, 100 - approvedW - inReviewW - rejectedW);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {f.order}.{" "}
          {locale === "en" ? f.titleEn || f.title : f.title}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="text-green-600 font-medium">{f.approved} ✓</span>
          {f.inReview > 0 && <span className="text-amber-600">{f.inReview} ⏳</span>}
          {f.rejected > 0 && <span className="text-red-500">{f.rejected} ✗</span>}
          <span className="text-slate-400">{approvedW}%</span>
        </div>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${approvedW}%` }}
          title={`Aprobado: ${f.approved}`}
        />
        <div
          className="bg-amber-400 transition-all"
          style={{ width: `${inReviewW}%` }}
          title={`En revisión: ${f.inReview}`}
        />
        <div
          className="bg-red-400 transition-all"
          style={{ width: `${rejectedW}%` }}
          title={`Rechazado: ${f.rejected}`}
        />
        <div
          className="bg-slate-200 transition-all"
          style={{ width: `${pendingW}%` }}
          title={`Pendiente: ${f.pending}`}
        />
      </div>
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  const locale: Locale = getLocale();
  const d = getDict(locale);
  const a = await computeAnalytics();

  const steps = await prisma.step.findMany({ orderBy: { order: "asc" } });

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    orderBy: { createdAt: "desc" },
    include: { submissions: { include: { step: true } } },
  });

  // Recent submissions (last 8)
  const recentSubs = await prisma.submission.findMany({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 8,
    include: { user: true, step: true },
  });

  const totalSteps = steps.length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alleanza-mark.svg" alt="Alleanza" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {locale === "en" ? "Dashboard" : "Panel General"}
              </h1>
              <p className="text-xs text-slate-500">
                {locale === "en" ? "Onboarding Overview" : "Vista de incorporación"}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin" className="btn-secondary text-sm">
              {locale === "en" ? "Review Queue" : "Cola de revisión"}
            </Link>
            <Link href="/admin/reports" className="btn-secondary text-sm">
              {d.admin.reports}
            </Link>
            <a href="/api/reports/export" className="btn-secondary text-sm">
              {d.reports.exportCsv}
            </a>
            <LanguageToggle />
            <NotificationBell />
            <LogoutButton />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* KPI Row */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            icon="👥"
            value={a.totalTechs}
            label={locale === "en" ? "Total Technicians" : "Técnicos Totales"}
          />
          <KpiCard
            icon="✅"
            value={a.completed}
            label={locale === "en" ? "Completed" : "Completados"}
            sub={`${pct(a.completed, a.totalTechs)}%`}
            color="text-green-600"
          />
          <KpiCard
            icon="🔄"
            value={a.inProgress}
            label={locale === "en" ? "In Progress" : "En Proceso"}
            sub={`${pct(a.inProgress, a.totalTechs)}%`}
            color="text-brand-600"
          />
          <KpiCard
            icon="⏸️"
            value={a.notStarted}
            label={locale === "en" ? "Not Started" : "Sin iniciar"}
            sub={`${pct(a.notStarted, a.totalTechs)}%`}
            color="text-slate-500"
          />
          <KpiCard
            icon="⏳"
            value={a.pendingReview}
            label={locale === "en" ? "Pending Review" : "En Revisión"}
            color="text-amber-600"
          />
          <KpiCard
            icon="⚡"
            value={avgLabel(a.avgReviewMs, locale)}
            label={locale === "en" ? "Avg Review Time" : "Tiempo Prom. Revisión"}
          />
        </section>

        {/* Donut + Legend / Queue Status */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Donut chart */}
          <div className="card p-6 flex flex-col items-center">
            <h2 className="mb-4 text-base font-semibold text-slate-700 self-start">
              {locale === "en" ? "Completion Overview" : "Progreso General"}
            </h2>
            <DonutChart a={a} />
            <div className="mt-6 w-full space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-3 w-3 rounded-full bg-green-500 inline-block" />
                  {locale === "en" ? "Completed" : "Completados"}
                </span>
                <span className="font-semibold text-green-600">{a.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-3 w-3 rounded-full bg-brand-500 inline-block" />
                  {locale === "en" ? "In Progress" : "En Proceso"}
                </span>
                <span className="font-semibold text-brand-600">{a.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-3 w-3 rounded-full bg-slate-400 inline-block" />
                  {locale === "en" ? "Not Started" : "Sin iniciar"}
                </span>
                <span className="font-semibold text-slate-500">{a.notStarted}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="mb-4 text-base font-semibold text-slate-700">
              {locale === "en" ? "Recent Submissions" : "Últimas Entregas"}
            </h2>
            {recentSubs.length === 0 ? (
              <p className="text-sm text-slate-400">{d.reports.noData}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSubs.map((sub) => {
                  const meta = statusMeta(sub.status as SubmissionStatus, locale);
                  const stepContent = localizeStep(sub.step, locale);
                  return (
                    <li key={sub.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="font-medium text-slate-800">{sub.user.name}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-slate-500">
                          {sub.step.order}. {stepContent.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                          {meta.icon} {meta.label}
                        </span>
                        {sub.submittedAt && (
                          <span className="text-xs text-slate-400">
                            {formatDate(sub.submittedAt, locale)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Step Funnel */}
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-700">
              {d.reports.funnelTitle}
            </h2>
            <div className="flex gap-4 text-xs text-slate-500">
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />{d.status.APPROVED}</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />{d.status.IN_REVIEW}</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />{d.status.REJECTED}</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" />{d.status.PENDING}</span>
            </div>
          </div>
          {a.totalTechs === 0 ? (
            <p className="text-sm text-slate-400">{d.reports.noData}</p>
          ) : (
            <div className="space-y-5">
              {a.funnel.map((f) => (
                <FunnelBar key={f.stepId} f={f} locale={locale} />
              ))}
            </div>
          )}
        </section>

        {/* Rejection Analysis */}
        {a.funnel.some((f) => f.rejected > 0) && (
          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-700">
              {locale === "en" ? "Rejection Analysis" : "Análisis de Rechazos"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">{locale === "en" ? "Step" : "Paso"}</th>
                    <th className="pb-2 pr-4 text-right">{locale === "en" ? "Rejected" : "Rechazos"}</th>
                    <th className="pb-2 pr-4 text-right">{locale === "en" ? "Rejection Rate" : "Tasa"}</th>
                    <th className="pb-2">{locale === "en" ? "Visual" : "Visual"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {a.funnel
                    .filter((f) => f.rejected > 0)
                    .sort((a, b) => b.rejected - a.rejected)
                    .map((f) => {
                      const rate = pct(f.rejected, f.total);
                      return (
                        <tr key={f.stepId}>
                          <td className="py-2.5 pr-4 font-medium text-slate-700">
                            {f.order}. {locale === "en" ? f.titleEn || f.title : f.title}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-bold text-red-600">
                            {f.rejected}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-500">
                            {rate}%
                          </td>
                          <td className="py-2.5 w-32">
                            <div className="h-2 w-full rounded-full bg-slate-100">
                              <div
                                className="h-2 rounded-full bg-red-400"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Technician Roster */}
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-700">
              {locale === "en" ? "Technician Roster" : "Lista de Técnicos"}
            </h2>
            <span className="text-xs text-slate-400">
              {technicians.length} {locale === "en" ? "technicians" : "técnicos"}
            </span>
          </div>
          {technicians.length === 0 ? (
            <p className="text-sm text-slate-400">{d.admin.noTechs}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">{locale === "en" ? "Name" : "Nombre"}</th>
                    <th className="pb-2 pr-4 hidden sm:table-cell">{locale === "en" ? "Enrolled" : "Inscrito"}</th>
                    <th className="pb-2 pr-4">{locale === "en" ? "Progress" : "Progreso"}</th>
                    <th className="pb-2 pr-4">{locale === "en" ? "Steps" : "Pasos"}</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicians.map((tech) => {
                    const subByStep = new Map(tech.submissions.map((s) => [s.stepId, s]));
                    const approvedCount = tech.submissions.filter((s) => s.status === "APPROVED").length;
                    const progressPct = pct(approvedCount, totalSteps);
                    const isComplete = approvedCount === totalSteps && totalSteps > 0;

                    return (
                      <tr key={tech.id} className="group hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-800">{tech.name}</p>
                          <p className="text-xs text-slate-400">{tech.email}</p>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-slate-500 text-xs">
                          {formatDate(tech.createdAt, locale)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-brand-500"}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${isComplete ? "text-green-600" : "text-brand-600"}`}>
                              {approvedCount}/{totalSteps}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {steps.map((step) => {
                              const sub = subByStep.get(step.id);
                              const status = (sub?.status ?? "PENDING") as SubmissionStatus;
                              const colors: Record<SubmissionStatus, string> = {
                                APPROVED: "bg-green-500",
                                IN_REVIEW: "bg-amber-400",
                                REJECTED: "bg-red-400",
                                PENDING: "bg-slate-200",
                              };
                              return (
                                <span
                                  key={step.id}
                                  className={`h-3 w-3 rounded-sm ${colors[status]}`}
                                  title={`${step.order}. ${localizeStep(step, locale).title}: ${status}`}
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/${tech.id}`}
                            className="text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                          >
                            {d.admin.viewHistory}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
