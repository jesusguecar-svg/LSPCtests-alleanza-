import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { landingPath } from "@/lib/constants";
import { LogoutButton } from "../logout-button";
import { NotificationBell } from "../notification-bell";
import { LanguageToggle } from "../language-toggle";
import { StepCard } from "./step-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICIAN") redirect(landingPath(session.role));

  const d = getDict(getLocale());

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
          <h1 className="text-xl font-bold">
            {d.dashboard.greeting(session.name.split(" ")[0])}
          </h1>
          <p className="text-sm text-slate-500">{d.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="card mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {d.dashboard.approvedOf(approved, total)}
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
            {d.dashboard.allDone}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{d.dashboard.helper}</p>
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
