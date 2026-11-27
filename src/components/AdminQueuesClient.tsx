"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Download,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sliders
} from "lucide-react";
import type { BookingWindowOption } from "@/lib/slots";
import { formatTime12h } from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";

interface DailyDoctorQueue {
  doctorId: string;
  doctorName: string;
  specialty: string;
  windows: BookingWindowOption[];
}

interface DoctorReportRow {
  doctorId: string;
  doctorName: string;
  specialty: string;
  totalBookings: number;
  activeCount: number;
  morningCount: number;
  eveningCount: number;
  completedCount: number;
  noShowCount: number;
  cancelledCount: number;
  revenue: number;
  discounts: number;
}

export function AdminQueuesClient({
  initialDate,
  initialRules,
  initialDailyQueues,
  initialReports
}: {
  initialDate: string;
  initialRules: { queueMinutesPerPatient: number; queueBufferMinutes: number };
  initialDailyQueues: DailyDoctorQueue[];
  initialReports: DoctorReportRow[];
}) {
  const [date, setDate] = useState(initialDate);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rules, setRules] = useState(initialRules);
  const [dailyQueues, setDailyQueues] = useState(initialDailyQueues);
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, string>>(
    {}
  );

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const qs = new URLSearchParams({ date });
        if (fromDate) qs.set("from", fromDate);
        if (toDate) qs.set("to", toDate);
        const res = await fetch(`/api/admin/queues?${qs.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRules(data.rules);
          setDailyQueues(data.dailyQueues || []);
          setReports(data.doctorReports || []);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [date, fromDate, toDate]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useQueueRealtime(() => loadData(true), {
    enabled: true,
    pollIntervalMs: 5000,
    key: `admin-queues-${date}`
  });

  async function updateCapacity(
    doctorId: string,
    session: "morning" | "evening",
    capacityOverride: number | null
  ) {
    const res = await fetch("/api/queue/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_capacity",
        doctorId,
        queueDate: date,
        session,
        capacityOverride
      })
    });
    if (res.ok) {
      await loadData(true);
    }
  }

  async function togglePause(
    doctorId: string,
    session: "morning" | "evening",
    isPaused: boolean
  ) {
    const res = await fetch("/api/queue/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_pause",
        doctorId,
        queueDate: date,
        session,
        isPaused
      })
    });
    if (res.ok) {
      await loadData(true);
    }
  }

  function exportCsvReport() {
    const headers = [
      "Doctor",
      "Specialty",
      "Total Bookings",
      "Active Bookings",
      "Morning Window",
      "Evening Window",
      "Completed",
      "No Show",
      "Cancelled",
      "Revenue INR",
      "Discounts INR"
    ];
    const rows = reports.map((r) => [
      `"${r.doctorName.replace(/"/g, '""')}"`,
      `"${r.specialty.replace(/"/g, '""')}"`,
      r.totalBookings,
      r.activeCount,
      r.morningCount,
      r.eveningCount,
      r.completedCount,
      r.noShowCount,
      r.cancelledCount,
      r.revenue,
      r.discounts
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `queue-report-${date}.csv`;
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
            Queue Capacity &amp; OPD Reports
          </h1>
          <p className="text-sm text-slate-600">
            Capacity rule: <strong>{rules.queueMinutesPerPatient} min</strong> per patient +{" "}
            <strong>{rules.queueBufferMinutes} min</strong> buffer per session.{" "}
            <Link
              href="/admin/settings"
              className="font-semibold text-brand-700 hover:underline"
            >
              Adjust global buffer in Settings &rarr;
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-clinical w-auto py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => loadData(false)}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Daily Queue Capacity Controls */}
      <div className="card-clinical overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Doctor Queue Windows &amp; Capacity ({date})
            </h2>
          </div>
          <Link href="/admin/doctors" className="text-xs font-semibold text-brand-700 hover:underline">
            Edit Weekly Availability &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Booking Window</th>
                <th className="px-4 py-3">Queue Load / Capacity</th>
                <th className="px-4 py-3">Now Serving</th>
                <th className="px-4 py-3 text-right">Override Capacity / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyQueues.flatMap((doc) =>
                doc.windows.map((win) => {
                  const key = `${doc.doctorId}-${win.session}`;
                  const draft = capacityDrafts[key] ?? String(win.maxCapacity);
                  const isPaused = win.reason === "closed";
                  return (
                    <tr key={key}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{doc.doctorName}</p>
                        <p className="text-xs text-slate-500">{doc.specialty}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-bold text-slate-800">{win.label}</p>
                        <p className="text-brand-700">
                          {formatTime12h(win.startTime)} &ndash;{" "}
                          {formatTime12h(win.endTime)} ({win.durationMinutes}m)
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-bold text-slate-900">
                          {win.bookedCount} / {win.maxCapacity} booked
                        </p>
                        <p className="text-slate-500">
                          {win.spotsRemaining} remaining
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#06213e] px-2.5 py-1 font-mono text-xs font-extrabold text-white">
                          <Activity className="h-3 w-3 text-emerald-400" />
                          <span>#{win.currentServingNumber}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={draft}
                            onChange={(e) =>
                              setCapacityDrafts((prev) => ({
                                ...prev,
                                [key]: e.target.value
                              }))
                            }
                            className="input-clinical w-20 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateCapacity(
                                doc.doctorId,
                                win.session,
                                Number(draft || 0)
                              )
                            }
                            className="btn-secondary px-2.5 py-1 text-xs"
                          >
                            Set
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateCapacity(doc.doctorId, win.session, null)
                            }
                            className="btn-secondary px-2.5 py-1 text-xs"
                            title="Reset to 15m/patient + buffer formula"
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              togglePause(doc.doctorId, win.session, !isPaused)
                            }
                            className={`btn-secondary px-2.5 py-1 text-xs ${
                              isPaused ? "text-emerald-700" : "text-amber-800"
                            }`}
                          >
                            {isPaused ? (
                              <>
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span>Resume</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="h-3.5 w-3.5" />
                                <span>Pause</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {dailyQueues.every((d) => d.windows.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No active doctor OPD windows on {date}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Queue Utilization & Booking Reports */}
      <div className="card-clinical overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Doctor Queue &amp; Revenue Reports
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-clinical w-auto py-1 text-xs"
              aria-label="Report from date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-clinical w-auto py-1 text-xs"
              aria-label="Report to date"
            />
            <button
              type="button"
              onClick={exportCsvReport}
              className="btn-primary px-3.5 py-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Total / Active</th>
                <th className="px-4 py-3">AM / PM</th>
                <th className="px-4 py-3">Done / No-Show / Cancelled</th>
                <th className="px-4 py-3 text-right">Collected / Discounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.doctorId}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{r.doctorName}</p>
                    <p className="text-xs text-slate-500">{r.specialty}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-bold text-slate-900">
                      {r.totalBookings}
                    </span>{" "}
                    total ({r.activeCount} active)
                  </td>
                  <td className="px-4 py-3 text-xs">
                    Morning: <strong>{r.morningCount}</strong> • Evening:{" "}
                    <strong>{r.eveningCount}</strong>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {r.completedCount} done • {r.noShowCount} no-show •{" "}
                    {r.cancelledCount} cancelled
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <p className="font-bold text-emerald-700">₹{r.revenue}</p>
                    {r.discounts > 0 && (
                      <p className="text-slate-500">Discounts: ₹{r.discounts}</p>
                    )}
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
