"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

export function LanguageToggle() {
  const router = useRouter();
  const { locale } = useI18n();

  function setLocale(next: Locale) {
    if (next === locale) return;
    // Cookie de 1 año; el servidor la lee en el próximo render.
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs font-medium">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
          className={`px-2.5 py-1.5 uppercase transition ${
            l === locale
              ? "bg-brand-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
