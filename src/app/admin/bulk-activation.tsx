"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../i18n-provider";

export type ActivationItem = {
  submissionId: string;
  techName: string;
  techEmail: string;
};

export function BulkActivation({ items }: { items: ActivationItem[] }) {
  const router = useRouter();
  const { d } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="card p-5 text-sm text-slate-500">{d.admin.bulkNone}</p>;
  }

  const allSelected = selected.size === items.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(items.map((i) => i.submissionId))
    );
  }

  async function activate() {
    if (selected.size === 0) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/submissions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action: "approve" }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? d.admin.actionError);
      return;
    }
    setMessage(d.admin.bulkResult(data.approved ?? selected.size));
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm text-slate-500">{d.admin.bulkHint}</p>

      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4"
        />
        {d.admin.selectAll}
      </label>

      <ul className="divide-y divide-slate-100 border-y border-slate-100">
        {items.map((item) => (
          <li key={item.submissionId} className="py-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={selected.has(item.submissionId)}
                onChange={() => toggle(item.submissionId)}
                className="h-4 w-4"
              />
              <span className="font-medium">{item.techName}</span>
              <span className="text-slate-500">{item.techEmail}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={activate}
          disabled={loading || selected.size === 0}
          className="btn-success"
        >
          {loading
            ? d.admin.activating
            : d.admin.activateSelected(selected.size)}
        </button>
        {message && <span className="text-sm text-green-700">{message}</span>}
      </div>
    </div>
  );
}
