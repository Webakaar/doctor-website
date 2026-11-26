"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, UserPlus } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

const DEMO_ACCOUNTS = [
  { label: "Doctor (Dr. Arjun)", email: "dr.arjun@auracare.example", pass: "Demo@1234" },
  { label: "Doctor (Dr. Kavya)", email: "dr.kavya@auracare.example", pass: "Demo@1234" },
  { label: "Super Admin", email: "admin@auracare.example", pass: "Demo@1234" }
];

export function AuthClient() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function redirectByRole(role: string) {
    if (role === "super_admin" || role === "staff") {
      router.push("/admin");
    } else if (role === "doctor") {
      router.push("/doctor");
    } else {
      router.push("/patient");
    }
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        return;
      }
      redirectByRole(data.user.role);
    } catch {
      setError("Network error during login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      redirectByRole(data.user.role);
    } catch {
      setError("Network error during registration.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (resetStep === "request") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to send reset instructions.");
          return;
        }
        if (data.demoResetToken) {
          setResetToken(data.demoResetToken);
          setNotice(
            `Reset token generated (SMTP in demo mode): ${data.demoResetToken}`
          );
        } else {
          setNotice(data.message);
        }
        setResetStep("confirm");
      } else {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, newPassword })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Password reset failed.");
          return;
        }
        setNotice("Password updated! You can now sign in with your new password.");
        setMode("login");
        setResetStep("request");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-12">
      <div className="card-clinical p-6 sm:p-8 lg:col-span-7">
        <div className="mb-6 flex gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              mode === "login"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              mode === "register"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Create Patient Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              mode === "forgot"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Reset Password
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
            {notice}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Sign In to Your Portal
            </h2>
            <p className="text-xs text-slate-500">
              Patients, Doctors, Hospital Staff, and Administrators sign in here.
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-clinical"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Patient Registration
            </h2>
            <p className="text-xs text-slate-500">
              Manage upcoming bookings, download references, and cancel eligible visits.
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="input-clinical"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Forgot / Reset Password
            </h2>
            {resetStep === "request" ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-clinical"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>{loading ? "Requesting..." : "Send Reset Token"}</span>
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="input-clinical font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-clinical"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  <span>Update Password</span>
                </button>
              </>
            )}
          </form>
        )}
      </div>

      <div className="card-clinical h-fit bg-brand-50/50 p-6 lg:col-span-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-800">
          Demo Portal Accounts
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Click any role below to fill credentials and test that portal:
        </p>

        <div className="mt-4 space-y-2.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setMode("login");
                setEmail(acc.email);
                setPassword(acc.pass);
              }}
              className="w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {acc.label}
                </span>
                <span className="text-[11px] font-semibold text-brand-700">
                  Fill &rarr;
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                {acc.email} • {acc.pass}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
