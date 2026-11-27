"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusHistory,
  Doctor,
  NotificationLog,
  PaymentRecord,
  Service
} from "@/types/hospital";
import {
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

export interface AdminAppointmentRow extends Appointment {
  doctorName: string;
  serviceName: string;
  payment?: PaymentRecord;
  history: AppointmentStatusHistory[];
  notifications: NotificationLog[];
}

export function AdminAppointmentsClient({
  initialAppointments,
  doctors,
  services
}: {
  initialAppointments: AdminAppointmentRow[];
  doctors: Doctor[];
  services: Service[];
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<AdminAppointmentRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = appointments.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      a.bookingRef.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      a.patientPhone.toLowerCase().includes(q);
    const matchesDoc = doctorFilter === "all" || a.doctorId === doctorFilter;
    const matchesSvc = serviceFilter === "all" || a.serviceId === serviceFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesDate = !dateFilter || a.appointmentDate === dateFilter;
    return (
      matchesQ && matchesDoc && matchesSvc && matchesStatus && matchesDate
    );
  });

  async function handleStatusChange(
    id: string,
    newStatus: AppointmentStatus
  ) {
    setBusy(true);
    try {
      const endpointAction =
        newStatus === "cancelled" ? "cancel" : "update_status";
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: endpointAction,
          status: newStatus,
          reason:
            newStatus === "cancelled"
              ? "Cancelled by hospital administration"
              : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to update status");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Manage Appointments
        </h1>
        <p className="text-sm text-slate-600">
          Search bookings, filter by doctor/service/date/status, inspect payment &amp; notification logs, and update statuses.
        </p>
      </div>

      <div className="card-clinical grid gap-3 p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Booking Ref or Patient..."
            className="input-clinical pl-9 text-xs"
          />
        </div>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="input-clinical text-xs"
        >
          <option value="all">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="input-clinical text-xs"
        >
          <option value="all">All Services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-clinical text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="serving">Serving Now</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-clinical text-xs"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card-clinical overflow-hidden lg:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor / Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`cursor-pointer hover:bg-brand-50/40 ${
                      selected?.id === a.id ? "bg-brand-50/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">
                      <p>{a.bookingRef}</p>
                      {typeof a.queueNumber === "number" && (
                        <span className="mt-1 inline-flex rounded bg-[#06213e] px-1.5 py-0.5 text-[10px] text-white">
                          Token #{a.queueNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {a.patientName}
                      </p>
                      <p className="text-xs text-slate-500">{a.patientPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {a.doctorName}
                      </p>
                      <p>
                        {a.appointmentDate} •{" "}
                        {formatSessionLabel(inferSessionFromAppointment(a))} (
                        {formatTime12h(a.slotStart)})
                      </p>
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <div>
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                      <div>
                        <PaymentStatusBadge status={a.paymentStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No appointments match your filters.
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
              Select an appointment row to inspect full details, update status, or view dispatch tracking.
            </p>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-brand-700">
                    {selected.bookingRef}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {selected.patientName}
                  </h2>
                </div>
                <AppointmentStatusBadge status={selected.status} />
              </div>

              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-slate-700">
                <p>
                  <strong>Contact:</strong> {selected.patientPhone} •{" "}
                  {selected.patientEmail}
                </p>
                <p>
                  <strong>Doctor:</strong> {selected.doctorName}
                </p>
                <p>
                  <strong>Service:</strong> {selected.serviceName}
                </p>
                <p>
                  <strong>Queue Token:</strong>{" "}
                  {selected.queueNumber ? `#${selected.queueNumber}` : "Assigned upon payment"}
                </p>
                <p>
                  <strong>Date &amp; Window:</strong> {selected.appointmentDate} •{" "}
                  {formatSessionLabel(inferSessionFromAppointment(selected))} (
                  {formatTime12h(selected.slotStart)} &ndash;{" "}
                  {formatTime12h(selected.slotEnd)})
                </p>
                <p>
                  <strong>Fee:</strong> ₹{selected.consultationFee} •{" "}
                  <strong>Payment:</strong> {selected.paymentStatus}
                </p>
                {selected.payment?.razorpayPaymentId && (
                  <p>
                    <strong>Razorpay Txn:</strong>{" "}
                    <span className="font-mono">
                      {selected.payment.razorpayPaymentId}
                    </span>
                  </p>
                )}
                <p>
                  <strong>Booked At:</strong>{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                {selected.cancellationReason && (
                  <p className="text-rose-700">
                    <strong>Cancellation Reason:</strong>{" "}
                    {selected.cancellationReason}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 font-bold uppercase text-slate-500">
                  Update Appointment Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { s: "confirmed", label: "Confirm" },
                      { s: "completed", label: "Completed" },
                      { s: "no_show", label: "No-show" },
                      { s: "cancelled", label: "Cancel & Refund" }
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.s}
                      type="button"
                      disabled={busy || selected.status === btn.s}
                      onClick={() => handleStatusChange(selected.id, btn.s)}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-bold uppercase text-slate-500">
                  Notification Dispatch Logs
                </p>
                {selected.notifications.length === 0 ? (
                  <p className="text-slate-500">No notification records.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selected.notifications.map((n) => (
                      <li
                        key={n.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5"
                      >
                        <span>
                          <strong className="uppercase">{n.channel}</strong> (
                          {n.event})
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {n.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
