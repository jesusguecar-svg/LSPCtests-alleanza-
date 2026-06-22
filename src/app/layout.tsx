import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n-server";
import { I18nProvider } from "./i18n-provider";

export const metadata: Metadata = {
  title: "Alleanza Insurance — Onboarding",
  description:
    "Onboarding de técnicos para el programa de telemedicina y pruebas diagnósticas.",
  icons: { icon: "/alleanza-mark.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
