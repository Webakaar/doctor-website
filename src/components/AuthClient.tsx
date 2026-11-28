"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogIn, MailCheck, UserPlus } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";
type LoginMethod = "password" | "code";

const DEMO_ACCOUNTS = [
  { label: "Reception Desk", email: "reception@auracare.example", pass: "Demo@1234" },
  { label: "Doctor (Dr. Arjun)", email: "dr.arjun@auracare.example", pass: "Demo@1234" },
  { label: "Doctor (Dr. Kavya)", email: "dr.kavya@auracare.example", pass: "Demo@1234" },
  { label: "Super Admin", email: "admin@auracare.example", pass: "Demo@1234" }
];

export function AuthClient() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);

  const [resetOtpToken, setResetOtpToken] = useState("");
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function redirectByRole(role: string) {
    if (role === "super_admin" || role === "staff") {
      router.push("/admin");
    } else if (role === "reception") {
      router.push("/reception");
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

  async function handleSendLoginCode(e?: React.FormEvent) {
    e?.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setNotice("");
    setOtpSending(true);
    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send 6-digit login code.");
        return;
      }
      setOtpToken(data.otpToken);
      setOtpCode("");
      setNotice(
        data.demoCode
          ? `6-digit code sent (Demo code: ${data.demoCode}).`
          : `6-digit sign-in code sent to ${cleanEmail}. Check your email inbox.`
      );
    } catch {
      setError("Network error while sending login code.");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyLoginCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Please enter the 6-digit numeric code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          otpToken,
          intent: "login"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid or expired 6-digit code.");
        return;
      }
      redirectByRole(data.user.role);
    } catch {
      setError("Network error while verifying login code.");
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

  async function requestResetOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid registered email address.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send 6-digit reset OTP.");
        return;
      }
      setResetOtpToken(data.otpToken);
      setResetOtpCode("");
      if (data.demoOtp) {
        setNotice(`6-digit reset OTP generated (Demo mode): ${data.demoOtp}`);
      } else {
        setNotice(data.message || `6-digit reset OTP sent to ${cleanEmail}. Check your inbox.`);
      }
      setResetStep("confirm");
    } catch {
      setError("Network error while sending reset OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (resetStep === "request") {
      await requestResetOtp();
      return;
    }

    if (!/^\d{6}$/.test(resetOtpCode.trim())) {
      setError("Please enter the 6-digit numeric OTP code.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: resetOtpCode.trim(),
          otpToken: resetOtpToken,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }
      setNotice("Password updated! You can now sign in with your new password.");
      setMode("login");
      setLoginMethod("password");
      setResetStep("request");
      setResetOtpToken("");
      setResetOtpCode("");
      setNewPassword("");
    } catch {
      setError("Network error while updating password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-12">
      <div className="card-clinical p-6 sm:p-8 lg:col-span-7">
        <div className="mb-6 grid grid-cols-2 gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-xs font-bold transition ${
              mode === "login" || mode === "forgot"
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
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-xs font-bold transition ${
              mode === "register"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Create Account
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
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Sign In to Your Portal
            </h2>
            <p className="text-xs text-slate-500">
              Patients, Doctors, Hospital Staff, and Administrators sign in here.
            </p>

            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setError("");
                  setNotice("");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  loginMethod === "password"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("code");
                  setError("");
                  setNotice("");
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  loginMethod === "code"
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MailCheck className="h-3.5 w-3.5" />
                <span>Login with Code</span>
              </button>
            </div>

            {loginMethod === "password" ? (
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setResetStep("request");
                        setError("");
                        setNotice("");
                      }}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Reset Password?
                    </button>
                  </div>
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
            ) : !otpToken ? (
              <form onSubmit={handleSendLoginCode} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setOtpToken("");
                      setOtpCode("");
                    }}
                    placeholder="you@example.com"
                    className="input-clinical"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpSending}
                  className="btn-primary w-full py-3"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending 6-Digit Code...</span>
                    </>
                  ) : (
                    <>
                      <MailCheck className="h-4 w-4" />
                      <span>Send 6-Digit Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginCode} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-xs">
                  <span className="font-medium text-slate-700">
                    Code sent to <strong>{email.trim().toLowerCase()}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpToken("");
                      setOtpCode("");
                      setNotice("");
                      setError("");
                    }}
                    className="font-bold text-brand-700 hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    6-Digit Login Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className="input-clinical text-center font-mono text-base font-bold tracking-[0.3em]"
                  />
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        <span>Verify &amp; Sign In</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={otpSending}
                    onClick={() => handleSendLoginCode()}
                    className="btn-secondary whitespace-nowrap px-4 py-3 text-xs font-bold"
                  >
                    {otpSending ? "Sending..." : "Resend"}
                  </button>
                </div>
              </form>
            )}
          </div>
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Reset Password
              </h2>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setResetStep("request");
                  setError("");
                  setNotice("");
                }}
                className="text-xs font-bold text-brand-700 hover:underline"
              >
                &larr; Back to Sign In
              </button>
            </div>
            <p className="text-xs text-slate-500">
              We&apos;ll send a 6-digit verification OTP to your registered email address.
            </p>
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
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending 6-Digit OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Send 6-Digit Reset OTP</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-xs">
                  <span className="font-medium text-slate-700">
                    OTP sent to <strong>{email.trim().toLowerCase()}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep("request");
                      setResetOtpToken("");
                      setResetOtpCode("");
                      setNotice("");
                      setError("");
                    }}
                    className="font-bold text-brand-700 hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={resetOtpCode}
                    onChange={(e) =>
                      setResetOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className="input-clinical text-center font-mono text-base font-bold tracking-[0.3em]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a new password"
                    className="input-clinical"
                  />
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Verify OTP &amp; Update Password</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={requestResetOtp}
                    className="btn-secondary whitespace-nowrap px-4 py-3 text-xs font-bold"
                  >
                    Resend
                  </button>
                </div>
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
                setLoginMethod("password");
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
