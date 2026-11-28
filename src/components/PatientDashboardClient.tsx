"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  CalendarPlus,
  Clock,
  Download,
  LogOut,
  Printer,
  Ticket,
  User,
  XCircle
} from "lucide-react";
import type {
  Appointment,
  BookingRulesConfig,
  BookingSession,
  PaymentRecord,
  PublicUser
} from "@/types/hospital";
import {
  evaluateCancellationEligibility,
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";
import {
  downloadAppointmentReceiptImage,
  printAppointmentReceipt
} from "@/lib/receipt";

export interface EnrichedPatientAppointment extends Appointment {
  doctorName: string;
  doctorSpecialty: string;
  serviceName: string;
  payment?: PaymentRecord;
}

interface PatientLiveProgressItem {
  appointmentId: string;
  bookingRef: string;
  doctorId: string;
  appointmentDate: string;
  session: BookingSession;
  queueNumber: number | null;
  status: Appointment["status"];
  currentServingNumber: number;
  isPaused: boolean;
  totalInSession: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  progressPercent: number;
}

export function PatientDashboardClient({
  user,
  initialAppointments,
  bookingRules,
  hospitalName = "BookMyDoc India",
  hospitalPhone,
  hospitalEmail,
  hospitalAddress
}: {
  user: PublicUser;
  initialAppointments: EnrichedPatientAppointment[];
  bookingRules: BookingRulesConfig;
  hospitalName?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalAddress?: string;
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled" | "profile">(
    "upcoming"
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTarget, setCancelTarget] =
    useState<EnrichedPatientAppointment | null>(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [liveMap, setLiveMap] = useState<Record<string, PatientLiveProgressItem>>(
    {}
  );

  const fetchLiveProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/queue/live?scope=patient");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, PatientLiveProgressItem> = {};
      for (const item of (data.patientProgress || []) as PatientLiveProgressItem[]) {
        map[item.appointmentId] = item;
      }
      setLiveMap(map);
      setAppointments((prev) =>
        prev.map((a) => {
          const live = map[a.id];
          if (!live) return a;
          return {
            ...a,
            status: live.status,
            queueNumber: live.queueNumber ?? a.queueNumber
          };
        })
      );
    } catch {
      // Ignore transient network errors during background sync
    }
  }, []);

  useEffect(() => {
    fetchLiveProgress();
  }, [fetchLiveProgress]);

  useQueueRealtime(fetchLiveProgress, {
    enabled: true,
    pollIntervalMs: 4500,
    key: `patient-${user.id}`
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingList = appointments.filter(
    (a) =>
      a.appointmentDate >= todayStr &&
      [
        "confirmed",
        "serving",
        "pending_confirmation",
        "pending_payment"
      ].includes(a.status)
  );
  const pastList = appointments.filter(
    (a) =>
      a.status === "completed" ||
      a.status === "no_show" ||
      (a.appointmentDate < todayStr && a.status !== "cancelled")
  );
  const cancelledList = appointments.filter((a) => a.status === "cancelled");

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    try {
      const res = await fetch(`/api/appointments/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason || "Cancelled by patient"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to cancel appointment.");
        return;
      }
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancelTarget.id
            ? { ...a, ...data.appointment }
            : a
        )
      );
      setCancelTarget(null);
      setCancelReason("");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setProfileErr(data.error || "Failed to update profile");
      return;
    }
    setProfileMsg("Profile updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const visibleList =
    tab === "upcoming"
      ? upcomingList
      : tab === "past"
      ? pastList
      : cancelledList;

  const initials = (user.fullName || "P")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Patient Portal Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#06213e] text-sm font-extrabold text-white shadow-sm">
              {initials}
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0b71c7]">
                Patient Portal
              </span>
              <h1 className="mt-1 truncate text-xl font-extrabold text-slate-900 sm:text-2xl">
                Welcome, {user.fullName}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                <span className="truncate">{user.email}</span>
                <span className="text-slate-300">•</span>
                <span>{user.phone || "No phone added"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:shrink-0 sm:items-center">
            <Link
              href="/book"
              className="btn-primary justify-center whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm"
            >
              <CalendarPlus className="h-4 w-4 shrink-0" />
              <span>Book Appointment</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 sm:text-sm"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 sm:inline-flex">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
          {[
            { key: "upcoming", label: "Upcoming", count: upcomingList.length },
            { key: "past", label: "Past", count: pastList.length },
            { key: "cancelled", label: "Cancelled", count: cancelledList.length },
            { key: "profile", label: "My Profile", count: undefined }
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key as typeof tab)}
                className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-[#06213e] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                }`}
              >
                <span>{t.label}</span>
                {typeof t.count === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/90 text-slate-600"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "profile" ? (
        <form
          onSubmit={handleSaveProfile}
          className="card-clinical mt-6 max-w-xl space-y-4 p-6"
        >
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <User className="h-5 w-5 text-brand-600" />
            <h2>Manage Patient Profile</h2>
          </div>

          {profileErr && (
            <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
              {profileErr}
            </div>
          )}
          {profileMsg && (
            <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
              {profileMsg}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-clinical"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Mobile Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-clinical"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Change Password (Optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="input-clinical"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6)"
                className="input-clinical"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Save Profile Changes
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleList.length === 0 ? (
            <div className="card-clinical p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No {tab} appointments found.
              </p>
              <Link href="/book" className="btn-primary mt-4">
                Book an Appointment
              </Link>
            </div>
          ) : (
            visibleList.map((appt) => {
              const eligibility = evaluateCancellationEligibility({
                appointment: appt,
                rules: bookingRules
              });
              const live = liveMap[appt.id];
              const sess = inferSessionFromAppointment(appt);
              const queueNum = live?.queueNumber ?? appt.queueNumber;
              const servingNum = live?.currentServingNumber ?? 0;
              const showLiveTracker =
                typeof queueNum === "number" &&
                ["confirmed", "serving", "pending_confirmation"].includes(
                  appt.status
                );
              const isYourTurn =
                appt.status === "serving" ||
                (typeof queueNum === "number" &&
                  servingNum > 0 &&
                  servingNum === queueNum);

              return (
                <article
                  key={appt.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)] transition hover:border-slate-300"
                >
                  {/* Ticket Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-slate-800 shadow-sm">
                        {appt.bookingRef}
                      </span>
                      <AppointmentStatusBadge status={appt.status} />
                      <PaymentStatusBadge status={appt.paymentStatus} />
                    </div>
                    {typeof queueNum === "number" && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#06213e] px-3 py-1 font-mono text-xs font-extrabold text-white shadow-xs">
                        <Ticket className="h-3.5 w-3.5 text-sky-300" />
                        <span>Token #{queueNum}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {/* Doctor & Schedule Info + Actions */}
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="space-y-2.5">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                            {appt.doctorName}
                          </h3>
                          <p className="text-xs font-semibold text-[#0b71c7]">
                            {appt.serviceName}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 font-medium text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{appt.appointmentDate}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 font-medium text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {formatSessionLabel(sess)} ({formatTime12h(appt.slotStart)} &ndash;{" "}
                              {formatTime12h(appt.slotEnd)})
                            </span>
                          </span>
                        </div>

                        {appt.cancellationReason && (
                          <p className="text-xs font-medium text-rose-600">
                            Reason: {appt.cancellationReason}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            printAppointmentReceipt({
                              hospitalName,
                              hospitalPhone,
                              hospitalEmail,
                              hospitalAddress,
                              appointment: appt,
                              doctorName: appt.doctorName,
                              serviceName: appt.serviceName,
                              paymentId: appt.payment?.razorpayPaymentId
                            })
                          }
                          className="btn-secondary justify-center px-3 py-2 text-xs"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print / PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadAppointmentReceiptImage({
                              hospitalName,
                              hospitalPhone,
                              hospitalEmail,
                              hospitalAddress,
                              appointment: appt,
                              doctorName: appt.doctorName,
                              serviceName: appt.serviceName,
                              paymentId: appt.payment?.razorpayPaymentId
                            })
                          }
                          className="btn-secondary justify-center border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#06213e] hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5 text-[#0b71c7]" />
                          <span>Download</span>
                        </button>
                        {eligibility.canCancel ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(appt)}
                            className="btn-secondary col-span-2 justify-center border-rose-200 px-3.5 py-2 text-xs text-rose-700 hover:bg-rose-50 sm:col-span-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel Booking</span>
                          </button>
                        ) : appt.status !== "cancelled" && eligibility.reason ? (
                          <span className="col-span-2 text-[11px] text-slate-400 sm:col-span-1 sm:max-w-[220px] sm:text-right">
                            {eligibility.reason}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Live OPD Queue Progress Tracker */}
                    {showLiveTracker && (
                      <div
                        className={`overflow-hidden rounded-2xl border ${
                          isYourTurn
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-slate-200/90 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 bg-white px-4 py-2.5">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-[#06213e]">
                            <Activity
                              className={`h-3.5 w-3.5 animate-pulse ${
                                isYourTurn ? "text-emerald-600" : "text-[#0b71c7]"
                              }`}
                            />
                            <span>Live OPD Queue Progress</span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isYourTurn
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-200/80 bg-slate-50 text-[#0b71c7]"
                            }`}
                          >
                            {isYourTurn
                              ? "Your Turn — Please Proceed to Doctor Room"
                              : live
                              ? live.patientsAhead === 0
                                ? "You're Next in Queue"
                                : `${live.patientsAhead} ahead • ~${live.estimatedWaitMinutes} min wait`
                              : "Connecting live queue..."}
                          </span>
                        </div>

                        <div className="p-3.5 sm:p-4">
                          <div className="grid grid-cols-3 divide-x divide-slate-200/80 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                            <div className="flex flex-col items-center justify-center px-2 py-3 text-center">
                              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Token
                              </span>
                              <span className="mt-1 font-mono text-lg font-black text-[#06213e]">
                                #{queueNum}
                              </span>
                            </div>
                            <div className="flex flex-col items-center justify-center px-2 py-3 text-center">
                              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Serving
                              </span>
                              <span className="mt-1 font-mono text-lg font-black text-emerald-700">
                                #{servingNum}
                              </span>
                            </div>
                            <div className="flex flex-col items-center justify-center px-2 py-3 text-center">
                              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Progress
                              </span>
                              <span className="mt-1 font-mono text-lg font-black text-[#0b71c7]">
                                {live?.progressPercent ?? 0}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[#0b71c7] transition-all duration-500"
                                style={{
                                  width: `${live?.progressPercent ?? 0}%`
                                }}
                              />
                            </div>
                            <span className="shrink-0 font-mono text-[10px] font-bold text-slate-500">
                              {live?.progressPercent ?? 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card-clinical w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900">
              Cancel Appointment {cancelTarget.bookingRef}?
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {cancelTarget.doctorName} on {cancelTarget.appointmentDate} at{" "}
              {formatTime12h(cancelTarget.slotStart)}.
            </p>
            {evaluateCancellationEligibility({
              appointment: cancelTarget,
              rules: bookingRules
            }).refundEligible && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                Eligible for automatic Razorpay refund (₹
                {cancelTarget.consultationFee}) within hospital cancellation policy.
              </div>
            )}
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Optional reason for cancellation..."
              className="input-clinical mt-4"
            />
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-secondary"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={busyId === cancelTarget.id}
                onClick={handleCancelConfirm}
                className="btn-primary bg-rose-600 hover:bg-rose-700"
              >
                {busyId === cancelTarget.id
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
