import { prisma } from "./prisma";

export type StepFunnel = {
  stepId: string;
  order: number;
  key: string;
  title: string;
  titleEn: string | null;
  approved: number;
  inReview: number;
  rejected: number;
  pending: number;
  total: number;
};

export type Analytics = {
  totalTechs: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  pendingReview: number;
  avgReviewMs: number | null;
  funnel: StepFunnel[];
};

// Calcula las métricas del programa a partir de las submissions.
export async function computeAnalytics(): Promise<Analytics> {
  const steps = await prisma.step.findMany({ orderBy: { order: "asc" } });
  const techs = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    include: { submissions: true },
  });

  const funnel: StepFunnel[] = steps.map((step) => {
    const subs = techs.flatMap((t) =>
      t.submissions.filter((s) => s.stepId === step.id)
    );
    const count = (status: string) =>
      subs.filter((s) => s.status === status).length;
    return {
      stepId: step.id,
      order: step.order,
      key: step.key,
      title: step.title,
      titleEn: step.titleEn,
      approved: count("APPROVED"),
      inReview: count("IN_REVIEW"),
      rejected: count("REJECTED"),
      pending: count("PENDING"),
      total: subs.length,
    };
  });

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  for (const t of techs) {
    const subs = t.submissions;
    const approved = subs.filter((s) => s.status === "APPROVED").length;
    if (subs.length > 0 && approved === subs.length) completed += 1;
    else if (approved === 0) notStarted += 1;
    else inProgress += 1;
  }

  const allSubs = techs.flatMap((t) => t.submissions);
  const pendingReview = allSubs.filter((s) => s.status === "IN_REVIEW").length;

  const reviewed = allSubs.filter((s) => s.reviewedAt && s.submittedAt);
  const avgReviewMs = reviewed.length
    ? reviewed.reduce(
        (acc, s) =>
          acc +
          (new Date(s.reviewedAt!).getTime() -
            new Date(s.submittedAt!).getTime()),
        0
      ) / reviewed.length
    : null;

  return {
    totalTechs: techs.length,
    completed,
    inProgress,
    notStarted,
    pendingReview,
    avgReviewMs,
    funnel,
  };
}
