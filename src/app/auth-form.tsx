"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { d } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? d.auth.genericError);
      setLoading(false);
      return;
    }

    router.replace(data.role === "MANAGER" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {d.auth.name}
            </label>
            <input name="name" required className="input" autoComplete="name" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {d.auth.phone}
            </label>
            <input name="phone" className="input" autoComplete="tel" />
          </div>
        </>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">{d.auth.email}</label>
        <input
          name="email"
          type="email"
          required
          className="input"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          {d.auth.password}
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="input"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? d.common.loading
          : mode === "login"
            ? d.auth.signIn
            : d.auth.createAccount}
      </button>
    </form>
  );
}
