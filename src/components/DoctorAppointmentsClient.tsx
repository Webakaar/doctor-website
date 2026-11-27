"use client";

import { useCallback, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/types/hospital";
import {
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

export interface DoctorAppointmentItem extends Appointment {
  serviceName: string;
}

export function DoctorAppointmentsClient({
  initialAppointments
}: {
  initialAppointments: DoctorAppointmentItem[];
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [tab, setTab] = useState<"today" | "upcoming" | "past" | "all">("today");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<DoctorAppointmentItem | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments?scope=doctor");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        }
      }
    } catch {
      // Ignore background refresh errors
    }
  }, []);

  useQueueRealtime(refreshQueue, {
    enabled: true,
    pollIntervalMs: 5000,
    key: "doctor-appointments"
  });

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const filtered = appointments
    .filter((a) => {
      if (tab === "today" && a.appointmentDate !== todayStr) return false;
      if (
        tab === "upcoming" &&
        !(
          a.appointmentDate >= todayStr &&
          [
            "confirmed",
            "serving",
            "pending_confirmation",
            "pending_payment"
          ].includes(a.status)
        )
      )
        return false;
      if (
        tab === "past" &&
        !(a.appointmentDate < todayStr || a.status === "completed")
      )
        return false;
      if (dateFilter && a.appointmentDate !== dateFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (a.appointmentDate !== b.appointmentDate) {
        return tab === "today"
          ? a.appointmentDate.localeCompare(b.appointmentDate)
          : b.appointmentDate.localeCompare(a.appointmentDate);
      }
      return (a.queueNumber || 9999) - (b.queueNumber || 9999);
    });

  async function updateStatus(id: string, status: AppointmentStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to update status.");
        return;
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data.appointment } : a))
      );
      if (selected?.id === id) {
        setSelected({ ...selected, ...data.appointment });
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_notes", notes: notesDraft })
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === selected.id ? { ...a, notes: data.appointment.notes } : a
          )
        );
        setSelected({ ...selected, notes: data.appointment.notes });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Today&apos;s Queue &amp; Appointments
        </h1>
        <p className="text-sm text-slate-600">
          View ordered queue tokens, call/complete patients, and record consultation notes.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "today", label: "Today" },
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                tab === t.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-clinical w-auto py-1.5 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-clinical w-auto py-1.5 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="serving">Serving Now</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="completed">Completed</option>
            <option value="no_show">No-show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card-clinical overflow-hidden lg:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Token / Ref</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => {
                      setSelected(a);
                      setNotesDraft(a.notes || "");
                    }}
                    className={`cursor-pointer transition hover:bg-brand-50/40 ${
                      selected?.id === a.id ? "bg-brand-50/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-[#06213e] px-2 py-0.5 font-mono text-xs font-extrabold text-white">
                        {a.queueNumber ? `#${a.queueNumber}` : "—"}
                      </span>
                      <p className="mt-1 font-mono text-[11px] font-bold text-brand-700">
                        {a.bookingRef}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {a.patientName}
                      </p>
                      <p className="text-xs text-slate-500">{a.serviceName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p>{a.appointmentDate}</p>
                      <p className="font-semibold">
                        {formatSessionLabel(inferSessionFromAppointment(a))} (
                        {formatTime12h(a.slotStart)})
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No matching appointments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-clinical h-fit p-6 lg:col-span-5">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Select an appointment on the left to view patient details, update status, or add consultation notes.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-700">
                    {selected.bookingRef}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selected.patientName}
                  </h2>
                </div>
                <AppointmentStatusBadge status={selected.status} />
              </div>

              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
                <p>
                  <strong>Phone:</strong> {selected.patientPhone}
                </p>
                <p>
                  <strong>Email:</strong> {selected.patientEmail}
                </p>
                <p>
                  <strong>Service:</strong> {selected.serviceName}
                </p>
                <p>
                  <strong>Queue Token:</strong>{" "}
                  {selected.queueNumber ? `#${selected.queueNumber}` : "Pending"}
                </p>
                <p>
                  <strong>Window:</strong> {selected.appointmentDate} •{" "}
                  {formatSessionLabel(inferSessionFromAppointment(selected))} (
                  {formatTime12h(selected.slotStart)} &ndash;{" "}
                  {formatTime12h(selected.slotEnd)})
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <strong>Payment:</strong>
                  <PaymentStatusBadge status={selected.paymentStatus} />
                </div>
                {selected.reasonForVisit && (
                  <p className="pt-1">
                    <strong>Reason:</strong> {selected.reasonForVisit}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                  Update Permitted Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { s: "serving", label: "Call / Serve Now" },
                      { s: "completed", label: "Mark Completed" },
                      { s: "no_show", label: "Mark No-show" },
                      { s: "cancelled", label: "Cancel" }
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.s}
                      type="button"
                      disabled={busy || selected.status === btn.s}
                      onClick={() => updateStatus(selected.id, btn.s)}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Booking / Consultation Notes
                </label>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="input-clinical text-xs"
                  placeholder="Add relevant booking notes..."
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveNotes}
                  className="btn-primary mt-2 w-full py-2 text-xs"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
