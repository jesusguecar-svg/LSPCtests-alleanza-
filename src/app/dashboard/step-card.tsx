"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Step, Submission } from "@prisma/client";
import { statusMeta, waitingTime } from "@/lib/format";
import { localizeStep } from "@/lib/i18n";
import type { SubmissionStatus } from "@/lib/constants";
import { useI18n } from "../i18n-provider";

export function StepCard({
  index,
  step,
  submission,
  locked,
}: {
  index: number;
  step: Step;
  submission: Submission | null;
  locked: boolean;
}) {
  const router = useRouter();
  const { d, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = (submission?.status ?? "PENDING") as SubmissionStatus;
  const meta = statusMeta(status, locale);
  const content = localizeStep(step, locale);
  const canEdit =
    !step.managerOnly &&
    !locked &&
    (status === "PENDING" || status === "REJECTED");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("stepId", step.id);

    const res = await fetch("/api/submissions", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? d.step.submitError);
      setLoading(false);
      return;
    }
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className={`card p-5 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {index}
          </span>
          <div>
            <h3 className="font-semibold">{content.title}</h3>
            <p className="text-sm text-slate-500">{content.description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Reloj de espera */}
      {status === "IN_REVIEW" && submission?.submittedAt && (
        <p className="mt-3 text-sm text-amber-700">
          {d.step.inReviewSince(waitingTime(submission.submittedAt, locale))}
        </p>
      )}

      {/* Feedback del manager (rechazo) */}
      {status === "REJECTED" && submission?.feedback && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-medium">{d.step.rejectionReason}</span>{" "}
          {submission.feedback}
        </div>
      )}

      {status === "APPROVED" && (
        <p className="mt-3 text-sm text-green-700">{d.step.approved}</p>
      )}

      {locked && <p className="mt-3 text-sm text-slate-500">{d.step.locked}</p>}

      {step.managerOnly && !locked && status !== "APPROVED" && (
        <p className="mt-3 text-sm text-slate-500">{d.step.managerWillDo}</p>
      )}

      {/* Acciones */}
      {!locked && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {step.externalUrl && (
            <a
              href={step.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              {d.common.openLink}
            </a>
          )}
          {canEdit && (
            <button
              className="btn-primary"
              onClick={() => setOpen((v) => !v)}
              type="button"
            >
              {status === "REJECTED" ? d.step.fixResend : d.step.complete}
            </button>
          )}
        </div>
      )}

      {/* Formulario de envío */}
      {open && canEdit && (
        <form
          onSubmit={onSubmit}
          className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <div className="rounded-md bg-white p-3 text-sm text-slate-600">
            <span className="font-medium text-slate-800">
              {d.step.instructions}
            </span>{" "}
            {content.instructions}
          </div>

          {step.requiresUpload && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                {d.step.fileLabel}
              </label>
              <input
                type="file"
                name="file"
                accept="image/*,application/pdf"
                required={!submission?.fileUrl}
                className="block w-full text-sm"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              {d.step.noteLabel}
            </label>
            <textarea name="note" rows={2} className="input" />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-success">
              {loading ? d.step.sending : d.step.submit}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(false)}
            >
              {d.common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
