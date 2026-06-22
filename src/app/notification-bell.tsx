"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: "APPROVED" | "REJECTED" | "SUBMITTED";
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

const ICON: Record<Notification["type"], string> = {
  APPROVED: "✓",
  REJECTED: "✗",
  SUBMITTED: "📥",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // sondeo cada 30 s
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      router.refresh(); // refresca estados/datos de la página
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notificaciones"
        className="btn-secondary relative px-3"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold">
            Notificaciones
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                No tienes notificaciones.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-slate-50 px-4 py-3 ${
                    n.read ? "" : "bg-brand-50/50"
                  }`}
                >
                  <span className="text-base leading-5">{ICON[n.type]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
