import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { AuthForm } from "../auth-form";
import { LanguageToggle } from "../language-toggle";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "MANAGER" ? "/admin" : "/dashboard");

  const d = getDict(getLocale());

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <LanguageToggle />
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {d.common.appName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{d.common.appTagline}</p>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">{d.auth.loginTitle}</h2>
          <AuthForm mode="login" />
          <p className="mt-4 text-center text-sm text-slate-500">
            {d.auth.newTech}{" "}
            <Link href="/register" className="font-medium text-brand-600">
              {d.auth.createHere}
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          {d.auth.demoNote}
        </p>
      </div>
    </main>
  );
}
