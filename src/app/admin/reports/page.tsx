import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { getDict, type Locale } from "@/lib/i18n";
import { canViewAdmin } from "@/lib/constants";
import { computeAnalytics, type Analytics } from "@/lib/analytics";
import { LogoutButton } from "../../logout-button";
import { LanguageToggle } from "../../language-toggle";

export const dynamic = "force-dynamic";

function avgReviewLabel(
  ms: number | null,
  d: ReturnType<typeof getDict>
): string {
  if (ms == null) return d.reports.none;
  const hours = ms / 3_600_000;
  if (hours >= 48) return `${(hours / 24).toFixed(1)} ${d.reports.daysUnit}`;
  return `${Math.max(1, Math.round(hours))} ${d.reports.hoursUnit}`;
}

function StatBar({ a }: { a: Analytics["funnel"][number] }) {
  const total = a.total || 1;
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="bg-green-500" style={{ width: seg(a.approved) }} />
      <div className="bg-amber-400" style={{ width: seg(a.inReview) }} />
      <div className="bg-red-400" style={{ width: seg(a.rejected) }} />
      <div className="bg-slate-200" style={{ width: seg(a.pending) }} />
    </div>
  );
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  const locale: Locale = getLocale();
  const d = getDict(locale);
  const a = await computeAnalytics();

  const stepTitle = (f: { title: string; titleEn: string | null }) =>
    locale === "en" ? f.titleEn || f.title : f.title;

  const kpis = [
    { label: d.admin.technicians, value: a.totalTechs, color: "" },
    { label: d.reports.completed, value: a.completed, color: "text-green-600" },
    {
      label: d.reports.inProgress,
      value: a.inProgress,
      color: "text-brand-600",
    },
    { label: d.reports.notStarted, value: a.notStarted, color: "text-slate-500" },
    {
      label: d.reports.pendingReview,
      value: a.pendingReview,
      color: "text-amber-600",
    },
  ];

  const rejections = a.funnel.filter((f) => f.rejected > 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/alleanza-mark.svg" alt="Alleanza" className="h-9 w-auto" />
          <div>
            <h1 className="text-xl font-bold">{d.reports.title}</h1>
            <p className="text-sm text-slate-500">{d.reports.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="btn-secondary text-sm">
            {d.reports.backToAdmin}
          </Link>
          <a href="/api/reports/export" className="btn-secondary text-sm">
            {d.reports.exportCsv}
          </a>
          <LanguageToggle />
          <LogoutButton />
        </div>
      </header>

      {/* KPIs */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-sm text-slate-500">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-2xl font-bold">{avgReviewLabel(a.avgReviewMs, d)}</p>
          <p className="text-sm text-slate-500">{d.reports.avgReview}</p>
        </div>
      </section>

      {/* Funnel por paso */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">{d.reports.funnelTitle}</h2>
        <div className="card p-5">
          {a.totalTechs === 0 ? (
            <p className="text-sm text-slate-500">{d.reports.noData}</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                  {d.status.APPROVED}
                </span>
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  {d.status.IN_REVIEW}
                </span>
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                  {d.status.REJECTED}
                </span>
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-200" />
                  {d.status.PENDING}
                </span>
              </div>
              <div className="space-y-4">
                {a.funnel.map((f) => (
                  <div key={f.stepId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {f.order}. {stepTitle(f)}
                      </span>
                      <span className="text-slate-500">
                        {f.approved}/{f.total} {d.status.APPROVED.toLowerCase()}
                      </span>
                    </div>
                    <StatBar a={f} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Rechazos por paso */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {d.reports.rejectionsTitle}
        </h2>
        <div className="card p-5">
          {rejections.length === 0 ? (
            <p className="text-sm text-slate-500">{d.reports.none}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rejections.map((f) => (
                <li
                  key={f.stepId}
                  className="flex items-center justify-between"
                >
                  <span>
                    {f.order}. {stepTitle(f)}
                  </span>
                  <span className="font-medium text-red-600">
                    {d.reports.rejections(f.rejected)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
