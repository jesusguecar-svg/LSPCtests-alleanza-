"use client";

import { createContext, useContext, useMemo } from "react";
import { getDict, type Dictionary, type Locale } from "@/lib/i18n";

type I18nValue = { locale: Locale; d: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // El locale viene del servidor (cookie) y se actualiza con router.refresh().
  const value = useMemo<I18nValue>(
    () => ({ locale, d: getDict(locale) }),
    [locale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  }
  return ctx;
}
