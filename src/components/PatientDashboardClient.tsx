"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  LogOut,
  User,
  XCircle
} from "lucide-react";
import type {
  Appointment,
  BookingRulesConfig,
  PaymentRecord,
  PublicUser
} from "@/types/hospital";
import {
  evaluateCancellationEligibility,
  formatTime12h
} from "@/lib/slots";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

export interface EnrichedPatientAppointment extends Appointment {
  doctorName: string;
  doctorSpecialty: string;
  serviceName: string;
  payment?: PaymentRecord;
}

export function PatientDashboardClient({
  user,
  initialAppointments,
  bookingRules
}: {
  user: PublicUser;
  initialAppointments: EnrichedPatientAppointment[];
  bookingRules: BookingRulesConfig;
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

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingList = appointments.filter(
    (a) =>
      a.appointmentDate >= todayStr &&
      ["confirmed", "pending_confirmation", "pending_payment"].includes(
        a.status
      )
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Patient Portal
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Welcome, {user.fullName}
          </h1>
          <p className="text-sm text-slate-600">
            {user.email} • {user.phone || "No phone added"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/book" className="btn-primary">
            <CalendarPlus className="h-4 w-4" />
            <span>Book New Appointment</span>
          </Link>
          <button type="button" onClick={handleLogout} className="btn-secondary">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "upcoming", label: `Upcoming (${upcomingList.length})` },
          { key: "past", label: `Past (${pastList.length})` },
          { key: "cancelled", label: `Cancelled (${cancelledList.length})` },
          { key: "profile", label: "My Profile & Password" }
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === t.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
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
              return (
                <div
                  key={appt.id}
                  className="card-clinical flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {appt.bookingRef}
                      </span>
                      <AppointmentStatusBadge status={appt.status} />
                      <PaymentStatusBadge status={appt.paymentStatus} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {appt.doctorName} —{" "}
                      <span className="font-medium text-brand-700">
                        {appt.serviceName}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-600">
                      {appt.appointmentDate} at {formatTime12h(appt.slotStart)} • Fee: ₹
                      {appt.consultationFee}
                    </p>
                    {appt.cancellationReason && (
                      <p className="text-xs text-rose-600">
                        Reason: {appt.cancellationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    {eligibility.canCancel ? (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(appt)}
                        className="btn-secondary border-rose-200 px-3.5 py-2 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel Booking</span>
                      </button>
                    ) : appt.status !== "cancelled" && eligibility.reason ? (
                      <span className="max-w-[220px] text-right text-[11px] text-slate-400">
                        {eligibility.reason}
                      </span>
                    ) : null}
                  </div>
                </div>
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
