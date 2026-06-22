import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { landingPath } from "@/lib/constants";
import { AuthForm } from "../auth-form";
import { LanguageToggle } from "../language-toggle";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(landingPath(session.role));

  const d = getDict(getLocale());

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <LanguageToggle />
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {d.auth.registerTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {d.auth.registerSubtitle}
          </p>
        </div>
        <div className="card p-6">
          <AuthForm mode="register" />
          <p className="mt-4 text-center text-sm text-slate-500">
            {d.auth.haveAccount}{" "}
            <Link href="/login" className="font-medium text-brand-600">
              {d.auth.signInHere}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
