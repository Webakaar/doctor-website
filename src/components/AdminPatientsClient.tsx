"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import type { AppointmentStatus, PaymentStatus } from "@/types/hospital";

export interface AdminPatientRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  appointments: {
    id: string;
    bookingRef: string;
    doctorName: string;
    serviceName: string;
    appointmentDate: string;
    slotStart: string;
    status: AppointmentStatus;
    paymentStatus: PaymentStatus;
  }[];
}

export function AdminPatientsClient({
  initialPatients
}: {
  initialPatients: AdminPatientRow[];
}) {
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminPatientRow | null>(null);

  const filtered = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q)
    );
  });

  async function toggleActive(patient: AdminPatientRow) {
    const res = await fetch("/api/admin/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: patient.id, isActive: !patient.isActive })
    });
    if (res.ok) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, isActive: !p.isActive } : p
        )
      );
      if (selected?.id === patient.id) {
        setSelected({ ...selected, isActive: !patient.isActive });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Manage Patients
        </h1>
        <p className="text-sm text-slate-600">
          Search registered patient accounts, inspect booking histories, and manage account status.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or mobile..."
          className="input-clinical pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card-clinical overflow-hidden lg:col-span-7">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer hover:bg-brand-50/40 ${
                    selected?.id === p.id ? "bg-brand-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {p.fullName}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{p.email}</p>
                    <p>{p.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {p.appointments.length}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {p.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-clinical h-fit p-6 lg:col-span-5">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Select a patient account to inspect profile details and appointment history.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selected.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selected.email} • {selected.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(selected)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {selected.isActive ? "Suspend Account" : "Activate Account"}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                  Appointment History ({selected.appointments.length})
                </p>
                <div className="space-y-2">
                  {selected.appointments.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-slate-100 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-700">
                          {a.bookingRef}
                        </span>
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">
                        {a.doctorName} ({a.serviceName})
                      </p>
                      <p className="text-slate-500">
                        {a.appointmentDate} at {a.slotStart}
                      </p>
                    </div>
                  ))}
                  {selected.appointments.length === 0 && (
                    <p className="text-xs text-slate-500">No bookings yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
