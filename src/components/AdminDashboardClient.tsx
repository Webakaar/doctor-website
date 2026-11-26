"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  Stethoscope,
  Users
} from "lucide-react";
import type { Appointment } from "@/types/hospital";
import { formatTime12h } from "@/lib/slots";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

interface DashboardMetrics {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  totalRegisteredPatients: number;
  activeDoctors: number;
  totalServices: number;
  totalRevenue: number;
  totalRefunded: number;
  openEnquiries: number;
}

interface RecentBooking extends Appointment {
  doctorName: string;
  serviceName: string;
}

export function AdminDashboardClient({
  initialMetrics,
  initialRecentBookings
}: {
  initialMetrics: DashboardMetrics;
  initialRecentBookings: RecentBooking[];
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [recent, setRecent] = useState(initialRecentBookings);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function applyDateFilter() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);
      const res = await fetch(`/api/admin/dashboard?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRecent(data.recentBookings);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hospital Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Real-time metrics calculated from database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input-clinical w-auto py-1.5 text-xs"
            aria-label="From date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input-clinical w-auto py-1.5 text-xs"
            aria-label="To date"
          />
          <button
            type="button"
            disabled={loading}
            onClick={applyDateFilter}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            {loading ? "Filtering..." : "Apply Range"}
          </button>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setMetrics(initialMetrics);
                setRecent(initialRecentBookings);
              }}
              className="btn-secondary px-3 py-2 text-xs"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Total Appointments</span>
            <CalendarCheck className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {metrics.totalAppointments}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Today: {metrics.todayAppointments} • Upcoming:{" "}
            {metrics.upcomingAppointments}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Status Breakdown</span>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {metrics.confirmedAppointments}
            <span className="ml-1.5 text-xs font-semibold text-slate-500">
              Confirmed
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pending: {metrics.pendingAppointments} • Cancelled:{" "}
            {metrics.cancelledAppointments}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Registered Patients</span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {metrics.totalRegisteredPatients}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active Doctors: {metrics.activeDoctors} • Services:{" "}
            {metrics.totalServices}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Payments Summary</span>
            <CreditCard className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Refunded: ₹{metrics.totalRefunded.toLocaleString("en-IN")} • New Enquiries:{" "}
            {metrics.openEnquiries}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card-clinical p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Bookings &amp; Activity
          </h2>
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Manage All Appointments</span>
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="py-2.5 pr-4">Booking Ref</th>
                <th className="py-2.5 pr-4">Patient</th>
                <th className="py-2.5 pr-4">Doctor &amp; Service</th>
                <th className="py-2.5 pr-4">Date &amp; Slot</th>
                <th className="py-2.5 pr-4">Appointment</th>
                <th className="py-2.5 pr-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-4 font-mono text-xs font-bold text-brand-700">
                    {a.bookingRef}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-slate-900">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-slate-500">{a.patientPhone}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-slate-800">
                      {a.doctorName}
                    </p>
                    <p className="text-xs text-slate-500">{a.serviceName}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600">
                    <p>{a.appointmentDate}</p>
                    <p>{formatTime12h(a.slotStart)}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <AppointmentStatusBadge status={a.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <PaymentStatusBadge status={a.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
