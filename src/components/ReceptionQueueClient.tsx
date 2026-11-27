"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Minus,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  UserX
} from "lucide-react";
import type { Appointment, BookingSession } from "@/types/hospital";
import type { BookingWindowOption } from "@/lib/slots";
import { formatTime12h } from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

interface DoctorBoard {
  doctorId: string;
  doctorName: string;
  specialty: string;
  windows: BookingWindowOption[];
}

interface QueueTicket extends Appointment {
  doctorName: string;
  serviceName: string;
  session: BookingSession;
}

function getTodayStr() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

export function ReceptionQueueClient({
  doctors
}: {
  doctors: { id: string; fullName: string; specialty: string }[];
}) {
  const [date, setDate] = useState(getTodayStr);
  const [doctorFilter, setDoctorFilter] = useState(doctors[0]?.id || "all");
  const [boards, setBoards] = useState<DoctorBoard[]>([]);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchLiveQueue = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const qs = new URLSearchParams({ date });
        if (doctorFilter !== "all") qs.set("doctorId", doctorFilter);
        const res = await fetch(`/api/queue/live?${qs.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBoards(data.doctorBoards || []);
          setTickets(data.queueItems || []);
          setLastUpdated(new Date().toLocaleTimeString("en-IN"));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [date, doctorFilter]
  );

  useEffect(() => {
    fetchLiveQueue(false);
  }, [fetchLiveQueue]);

  useQueueRealtime(() => fetchLiveQueue(true), {
    enabled: true,
    pollIntervalMs: 4000,
    key: `reception-${date}-${doctorFilter}`
  });

  async function runQueueAction(
    key: string,
    payload: Record<string, unknown>
  ) {
    setBusyKey(key);
    try {
      const res = await fetch("/api/queue/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to update queue.");
        return;
      }
      await fetchLiveQueue(true);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>Real-Time Queue Sync Active</span>
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Reception OPD Queue Control
          </h1>
          <p className="text-sm text-slate-600">
            Call the next patient token, adjust current serving numbers in real time, and manage live patient check-ins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-clinical w-auto py-2 text-xs"
          />
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="input-clinical w-auto py-2 text-xs"
          >
            <option value="all">All Active Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fetchLiveQueue(false)}
            className="btn-secondary px-3 py-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{lastUpdated ? `Synced ${lastUpdated}` : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Doctor Booking Window Boards */}
      {boards.length === 0 && !loading ? (
        <div className="card-clinical p-8 text-center text-sm text-slate-600">
          No OPD doctor windows are active on {date}.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {boards.map((board) => (
            <div key={board.doctorId} className="card-clinical p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {board.doctorName}
                  </h2>
                  <p className="text-xs font-semibold text-brand-700">
                    {board.specialty}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {board.windows.length} Session(s)
                </span>
              </div>

              {board.windows.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500">
                  Doctor not scheduled on {date}.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {board.windows.map((win) => {
                    const sessionKey = `${board.doctorId}-${win.session}`;
                    const isPaused = win.reason === "closed";
                    return (
                      <div
                        key={win.session}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {win.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTime12h(win.startTime)} &ndash;{" "}
                              {formatTime12h(win.endTime)} • Capacity:{" "}
                              <strong>
                                {win.bookedCount}/{win.maxCapacity}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-[#06213e] px-3.5 py-1.5 text-center text-white">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-sky-200">
                                Serving
                              </span>
                              <span className="font-mono text-lg font-black">
                                #{win.currentServingNumber}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busyKey === `${sessionKey}-next`}
                            onClick={() =>
                              runQueueAction(`${sessionKey}-next`, {
                                action: "call_next",
                                doctorId: board.doctorId,
                                queueDate: date,
                                session: win.session
                              })
                            }
                            className="btn-primary px-4 py-2 text-xs"
                          >
                            <span>Call Next Patient</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={
                              win.currentServingNumber <= 0 ||
                              busyKey === `${sessionKey}-dec`
                            }
                            onClick={() =>
                              runQueueAction(`${sessionKey}-dec`, {
                                action: "set_serving",
                                doctorId: board.doctorId,
                                queueDate: date,
                                session: win.session,
                                servingNumber: Math.max(
                                  0,
                                  win.currentServingNumber - 1
                                )
                              })
                            }
                            className="btn-secondary px-2.5 py-2 text-xs"
                            aria-label="Decrement current token"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={busyKey === `${sessionKey}-inc`}
                            onClick={() =>
                              runQueueAction(`${sessionKey}-inc`, {
                                action: "set_serving",
                                doctorId: board.doctorId,
                                queueDate: date,
                                session: win.session,
                                servingNumber: win.currentServingNumber + 1
                              })
                            }
                            className="btn-secondary px-2.5 py-2 text-xs"
                            aria-label="Increment current token"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={busyKey === `${sessionKey}-pause`}
                            onClick={() =>
                              runQueueAction(`${sessionKey}-pause`, {
                                action: "toggle_pause",
                                doctorId: board.doctorId,
                                queueDate: date,
                                session: win.session,
                                isPaused: !isPaused
                              })
                            }
                            className={`btn-secondary ml-auto px-3 py-2 text-xs ${
                              isPaused
                                ? "border-emerald-200 text-emerald-700"
                                : "border-amber-200 text-amber-800"
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
                                <span>Pause Bookings</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ordered Patient Queue Table */}
      <div className="card-clinical overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Patient Queue Roster ({date}) — {tickets.length} Patient(s)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Patient &amp; Ref</th>
                <th className="px-4 py-3">Doctor &amp; Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Queue Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className={t.status === "serving" ? "bg-sky-50/70" : ""}>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-xl bg-[#06213e] px-2 font-mono text-sm font-black text-white">
                      {t.queueNumber ? `#${t.queueNumber}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{t.patientName}</p>
                    <p className="text-xs text-slate-500">
                      {t.patientPhone} •{" "}
                      <span className="font-mono">{t.bookingRef}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-slate-800">{t.doctorName}</p>
                    <p className="text-brand-700">
                      {t.session === "evening" ? "Evening Window" : "Morning Window"} (
                      {formatTime12h(t.slotStart)})
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <AppointmentStatusBadge status={t.status} />
                      <PaymentStatusBadge status={t.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!["cancelled", "completed"].includes(t.status) && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {t.status !== "serving" && (
                          <button
                            type="button"
                            disabled={busyKey === `row-${t.id}`}
                            onClick={() =>
                              runQueueAction(`row-${t.id}`, {
                                action: "set_appointment_status",
                                doctorId: t.doctorId,
                                queueDate: t.appointmentDate,
                                session: t.session,
                                appointmentId: t.id,
                                status: "serving"
                              })
                            }
                            className="btn-primary px-2.5 py-1.5 text-xs"
                          >
                            Call / Serve
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyKey === `row-${t.id}`}
                          onClick={() =>
                            runQueueAction(`row-${t.id}`, {
                              action: "set_appointment_status",
                              doctorId: t.doctorId,
                              queueDate: t.appointmentDate,
                              session: t.session,
                              appointmentId: t.id,
                              status: "completed"
                            })
                          }
                          className="btn-secondary border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Done</span>
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `row-${t.id}`}
                          onClick={() =>
                            runQueueAction(`row-${t.id}`, {
                              action: "set_appointment_status",
                              doctorId: t.doctorId,
                              queueDate: t.appointmentDate,
                              session: t.session,
                              appointmentId: t.id,
                              status: "no_show"
                            })
                          }
                          className="btn-secondary px-2.5 py-1.5 text-xs text-slate-600"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>No-show</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No patients in queue for {date}.
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
