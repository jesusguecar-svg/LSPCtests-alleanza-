"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";

export function LogoutButton() {
  const router = useRouter();
  const { d } = useI18n();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn-secondary text-sm">
      {d.common.logout}
    </button>
  );
}
