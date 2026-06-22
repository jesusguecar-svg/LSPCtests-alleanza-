import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from "./i18n";

// Lee el idioma desde la cookie (solo en componentes/handlers de servidor).
export function getLocale(): Locale {
  const value = cookies().get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
