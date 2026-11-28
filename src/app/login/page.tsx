import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PublicShell } from "@/components/PublicShell";
import { AuthClient } from "@/components/AuthClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "super_admin" || user.role === "staff") redirect("/admin");
    if (user.role === "reception") redirect("/reception");
    if (user.role === "doctor") redirect("/doctor");
    redirect("/patient");
  }

  return (
    <PublicShell>
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Secure role-based access to appointments, schedules, and hospital operations.
            </p>
          </div>
          <AuthClient />
        </div>
      </section>
    </PublicShell>
  );
}
