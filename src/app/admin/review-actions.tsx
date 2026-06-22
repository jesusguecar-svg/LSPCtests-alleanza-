"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../i18n-provider";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const { d } = useI18n();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "reject") {
    if (action === "reject" && !feedback.trim()) {
      setShowReject(true);
      setError(d.admin.rejectNeedsReason);
      return;
    }
    setLoading(action);
    setError(null);

    const res = await fetch(`/api/submissions/${submissionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, feedback: feedback.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? d.admin.actionError);
      setLoading(null);
      return;
    }
    setLoading(null);
    setFeedback("");
    setShowReject(false);
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {showReject && (
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder={d.admin.rejectPlaceholder}
          className="input mb-2"
        />
      )}
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => review("approve")}
          disabled={loading !== null}
          className="btn-success"
        >
          {loading === "approve" ? "..." : d.admin.approve}
        </button>
        {showReject ? (
          <button
            onClick={() => review("reject")}
            disabled={loading !== null}
            className="btn-danger"
          >
            {loading === "reject" ? "..." : d.admin.confirmReject}
          </button>
        ) : (
          <button
            onClick={() => setShowReject(true)}
            disabled={loading !== null}
            className="btn-secondary"
          >
            {d.admin.reject}
          </button>
        )}
      </div>
    </div>
  );
}
