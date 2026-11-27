"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  IndianRupee,
  RotateCcw
} from "lucide-react";
import type { Appointment } from "@/types/hospital";
import {
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

export interface DoctorReportAppointment extends Appointment {
  serviceName: string;
}

export function DoctorReportsClient({
  doctorName,
  appointments
}: {
  doctorName: string;
  appointments: DoctorReportAppointment[];
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const monthPrefix = todayStr.slice(0, 7);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (fromDate && a.appointmentDate < fromDate) return false;
      if (toDate && a.appointmentDate > toDate) return false;
      return true;
    });
  }, [appointments, fromDate, toDate]);

  const metrics = useMemo(() => {
    const paid = filtered.filter((a) => a.paymentStatus === "paid");
    const totalEarnings = paid.reduce((sum, a) => sum + a.consultationFee, 0);
    const todayEarnings = paid
      .filter((a) => a.appointmentDate === todayStr)
      .reduce((sum, a) => sum + a.consultationFee, 0);
    const monthEarnings = paid
      .filter((a) => a.appointmentDate.startsWith(monthPrefix))
      .reduce((sum, a) => sum + a.consultationFee, 0);
    const totalRefunded = filtered
      .filter((a) => a.paymentStatus === "refunded")
      .reduce((sum, a) => sum + a.consultationFee, 0);
    const totalDiscounts = filtered
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + (a.discountAmount || 0), 0);

    const active = filtered.filter((a) => a.status !== "cancelled");
    const morningCount = active.filter(
      (a) => inferSessionFromAppointment(a) === "morning"
    ).length;
    const eveningCount = active.filter(
      (a) => inferSessionFromAppointment(a) === "evening"
    ).length;
    const completedCount = filtered.filter(
      (a) => a.status === "completed"
    ).length;
    const confirmedCount = filtered.filter((a) =>
      ["confirmed", "serving"].includes(a.status)
    ).length;
    const noShowCount = filtered.filter((a) => a.status === "no_show").length;
    const cancelledCount = filtered.filter(
      (a) => a.status === "cancelled"
    ).length;

    return {
      totalEarnings,
      todayEarnings,
      monthEarnings,
      totalRefunded,
      totalDiscounts,
      totalCount: filtered.length,
      morningCount,
      eveningCount,
      completedCount,
      confirmedCount,
      noShowCount,
      cancelledCount
    };
  }, [filtered, todayStr, monthPrefix]);

  const dailySeries = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; earnings: number; visits: number }
    >();
    for (const a of filtered) {
      const existing = byDate.get(a.appointmentDate) || {
        date: a.appointmentDate,
        earnings: 0,
        visits: 0
      };
      if (a.status !== "cancelled") {
        existing.visits += 1;
      }
      if (a.paymentStatus === "paid") {
        existing.earnings += a.consultationFee;
      }
      byDate.set(a.appointmentDate, existing);
    }

    const toIsoDate = (d: Date) =>
      [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
      ].join("-");

    let startDate: Date;
    if (fromDate) {
      startDate = new Date(`${fromDate}T00:00:00`);
    } else if (toDate) {
      startDate = new Date(`${toDate}T00:00:00`);
      startDate.setDate(startDate.getDate() - 6);
    } else {
      startDate = new Date(`${todayStr}T00:00:00`);
      const latestApptDate = filtered
        .map((a) => a.appointmentDate)
        .sort()
        .pop();
      if (latestApptDate && latestApptDate < todayStr) {
        startDate = new Date(`${latestApptDate}T00:00:00`);
        startDate.setDate(startDate.getDate() - 6);
      }
    }

    const days7: { date: string; earnings: number; visits: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      const dateKey = toIsoDate(cur);
      days7.push(
        byDate.get(dateKey) || { date: dateKey, earnings: 0, visits: 0 }
      );
    }
    return days7;
  }, [filtered, fromDate, toDate, todayStr]);

  const maxDailyEarnings = Math.max(
    0,
    ...dailySeries.map((d) => d.earnings)
  );
  const windowTotal = metrics.morningCount + metrics.eveningCount;
  const morningPct =
    windowTotal > 0 ? Math.round((metrics.morningCount / windowTotal) * 100) : 0;
  const eveningPct = windowTotal > 0 ? 100 - morningPct : 0;
  const ringCircumference = 2 * Math.PI * 36;
  const morningStroke =
    windowTotal > 0
      ? (metrics.morningCount / windowTotal) * ringCircumference
      : 0;

  function exportCsv() {
    const headers = [
      "Booking Ref",
      "Token",
      "Date",
      "Window",
      "Patient",
      "Phone",
      "Service",
      "Original Fee",
      "Coupon",
      "Discount",
      "Net Paid",
      "Payment Status",
      "Appointment Status"
    ];
    const rows = filtered.map((a) => {
      const sess = formatSessionLabel(inferSessionFromAppointment(a));
      return [
        a.bookingRef,
        a.queueNumber ?? "",
        a.appointmentDate,
        `"${sess}"`,
        `"${a.patientName.replace(/"/g, '""')}"`,
        a.patientPhone,
        `"${a.serviceName.replace(/"/g, '""')}"`,
        a.originalFee ?? a.consultationFee,
        a.couponCode ?? "",
        a.discountAmount ?? 0,
        a.consultationFee,
        a.paymentStatus,
        a.status
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doctor-earnings-report-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Total Earnings &amp; Reports
          </h1>
          <p className="text-sm text-slate-600">
            Consultation earnings, OPD window activity, and downloadable settlement ledger for {doctorName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
            className="input-clinical w-auto py-1.5 text-xs"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
            className="input-clinical w-auto py-1.5 text-xs"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="btn-primary px-3.5 py-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Earnings & Activity KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Total Earnings</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            ₹{metrics.totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Month: ₹{metrics.monthEarnings.toLocaleString("en-IN")} • Today: ₹
            {metrics.todayEarnings.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>OPD Consultations</span>
            <CalendarDays className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {metrics.totalCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Morning: {metrics.morningCount} • Evening: {metrics.eveningCount}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Completion Summary</span>
            <CheckCircle2 className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {metrics.completedCount}
            <span className="ml-1.5 text-xs font-semibold text-slate-500">
              Completed
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active: {metrics.confirmedCount} • No-show: {metrics.noShowCount} • Cancelled:{" "}
            {metrics.cancelledCount}
          </p>
        </div>

        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Refunds &amp; Discounts</span>
            <BarChart3 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            ₹{metrics.totalRefunded.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Promo Discounts Applied: ₹{metrics.totalDiscounts.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Interactive Graphs & Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Daily Earnings Bar Chart */}
        <div className="card-clinical p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Daily Earnings &amp; Visits Graph (7 Days)
              </h2>
              <p className="text-xs text-slate-500">
                7-day revenue collected and consultation count
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              Peak: ₹{maxDailyEarnings.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="mt-6 flex h-52 items-end gap-2 border-b border-slate-200 px-1 pb-2 sm:gap-3 sm:px-2">
            {dailySeries.map((day) => {
              const hasEarnings = day.earnings > 0 && maxDailyEarnings > 0;
              const heightPct = hasEarnings
                ? Math.max(12, Math.round((day.earnings / maxDailyEarnings) * 100))
                : 0;
              const shortDate = new Date(`${day.date}T00:00:00`).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short" }
              );
              return (
                <div
                  key={day.date}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <span
                    className={`mb-1 text-[10px] font-extrabold sm:text-[11px] ${
                      day.earnings > 0 ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    ₹{day.earnings.toLocaleString("en-IN")}
                  </span>
                  <div className="relative flex w-full max-w-[40px] flex-1 items-end">
                    {hasEarnings ? (
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-[#06213e] to-[#0b71c7] shadow-sm transition-all duration-300 group-hover:from-[#0b71c7] group-hover:to-sky-400"
                        style={{ height: `${heightPct}%` }}
                        title={`${day.date}: ₹${day.earnings} (${day.visits} visits)`}
                      />
                    ) : (
                      <div
                        className="h-1.5 w-full rounded-t-md bg-slate-200"
                        title={`${day.date}: ₹0 (${day.visits} visits)`}
                      />
                    )}
                  </div>
                  <span className="mt-2 whitespace-nowrap text-[10px] font-bold text-slate-600">
                    {shortDate}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {day.visits} {day.visits === 1 ? "visit" : "visits"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OPD Window Donut + Consultation Status Mix */}
        <div className="card-clinical flex flex-col justify-between p-5 lg:col-span-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              OPD Window &amp; Status Mix
            </h2>
            <p className="text-xs text-slate-500">
              Morning vs Evening queue split and completion ratio
            </p>
          </div>

          <div className="my-4 flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="11"
                />
                {windowTotal > 0 && (
                  <>
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="11"
                      strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      fill="none"
                      stroke="#0b71c7"
                      strokeWidth="11"
                      strokeDasharray={`${morningStroke} ${ringCircumference}`}
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
              <div className="absolute text-center">
                <span className="block text-sm font-black text-slate-900">
                  {windowTotal}
                </span>
                <span className="block text-[9px] font-bold uppercase text-slate-400">
                  Active
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0b71c7]" />
                  Morning Window
                </span>
                <span className="font-bold text-slate-900">
                  {metrics.morningCount} ({morningPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0d9488]" />
                  Evening Window
                </span>
                <span className="font-bold text-slate-900">
                  {metrics.eveningCount} ({eveningPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {[
              {
                label: "Completed",
                count: metrics.completedCount,
                bar: "bg-emerald-500"
              },
              {
                label: "Confirmed / Serving",
                count: metrics.confirmedCount,
                bar: "bg-[#0b71c7]"
              },
              {
                label: "No-show",
                count: metrics.noShowCount,
                bar: "bg-amber-500"
              },
              {
                label: "Cancelled",
                count: metrics.cancelledCount,
                bar: "bg-rose-500"
              }
            ].map((row) => {
              const pct =
                metrics.totalCount > 0
                  ? Math.round((row.count / metrics.totalCount) * 100)
                  : 0;
              return (
                <div key={row.label} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600">{row.label}</span>
                    <span className="font-bold text-slate-800">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Earnings & Consultation Ledger */}
      <div className="card-clinical overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Consultation Fee &amp; Queue Report ({filtered.length} records)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ref / Token</th>
                <th className="px-4 py-3">Patient &amp; Service</th>
                <th className="px-4 py-3">Date &amp; Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Fee Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">
                    <p>{a.bookingRef}</p>
                    {typeof a.queueNumber === "number" && (
                      <span className="mt-1 inline-flex rounded bg-[#06213e] px-1.5 py-0.5 text-[10px] text-white">
                        Token #{a.queueNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{a.patientName}</p>
                    <p className="text-xs text-slate-500">{a.serviceName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">{a.appointmentDate}</p>
                    <p>
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
                  <td className="px-4 py-3 text-right text-xs">
                    <p className="text-sm font-extrabold text-slate-900">
                      ₹{a.consultationFee}
                    </p>
                    {a.couponCode && (a.discountAmount || 0) > 0 && (
                      <p className="text-emerald-700">
                        {a.couponCode} (-₹{a.discountAmount})
                      </p>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No appointments match this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
