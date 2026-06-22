import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "MANAGER" ? "/admin" : "/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Empieza tu proceso de onboarding como técnico
          </p>
        </div>
        <div className="card p-6">
          <AuthForm mode="register" />
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-brand-600">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
