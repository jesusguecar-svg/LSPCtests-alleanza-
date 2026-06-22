import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "MANAGER" ? "/admin" : "/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Panel de Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Programa de telemedicina y pruebas diagnósticas
          </p>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Iniciar sesión</h2>
          <AuthForm mode="login" />
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Eres técnico nuevo?{" "}
            <Link href="/register" className="font-medium text-brand-600">
              Crea tu cuenta
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Cuentas demo — Manager: manager@lspc.test / manager123 · Técnico:
          tecnico@lspc.test / tecnico123
        </p>
      </div>
    </main>
  );
}
