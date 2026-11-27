"use client";

import { useState } from "react";
import { AlertTriangle, CalendarOff, Save, Trash2 } from "lucide-react";
import type { BlockedSlot, BlockedSlotType, DoctorSchedule } from "@/types/hospital";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

interface ConflictItem {
  id: string;
  bookingRef: string;
  patientName: string;
  appointmentDate: string;
  slotStart: string;
}

export function DoctorAvailabilityClient({
  doctorId,
  doctorName,
  initialSchedules,
  initialBlocks
}: {
  doctorId: string;
  doctorName: string;
  initialSchedules: DoctorSchedule[];
  initialBlocks: BlockedSlot[];
}) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((dow) => {
      const existing = initialSchedules.find((s) => s.dayOfWeek === dow);
      return (
        existing || {
          id: `temp-${dow}`,
          doctorId,
          dayOfWeek: dow,
          startTime: "09:00",
          endTime: "17:00",
          breakStart: "13:00",
          breakEnd: "14:00",
          slotDurationMins: 30,
          isAvailable: dow !== 0
        }
      );
    })
  );
  const [blocks, setBlocks] = useState<BlockedSlot[]>(initialBlocks);

  const [blockedDate, setBlockedDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("15:00");
  const [reason, setReason] = useState("");
  const [blockType, setBlockType] = useState<BlockedSlotType>("leave");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [conflictModal, setConflictModal] = useState<{
    action: "save_schedules" | "add_block";
    warning: string;
    conflicts: ConflictItem[];
  } | null>(null);

  function updateDay(dow: number, patch: Partial<DoctorSchedule>) {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dow ? { ...s, ...patch } : s))
    );
  }

  async function saveSchedules(force = false) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_schedules",
          doctorId,
          force,
          schedules: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            breakStart: s.breakStart || undefined,
            breakEnd: s.breakEnd || undefined,
            slotDurationMins: Number(s.slotDurationMins || 15),
            morningCapacityOverride: s.morningCapacityOverride ?? null,
            eveningCapacityOverride: s.eveningCapacityOverride ?? null,
            isAvailable: s.isAvailable
          }))
        })
      });
      const data = await res.json();
      if (res.status === 409 && data.conflicts) {
        setConflictModal({
          action: "save_schedules",
          warning: data.warning,
          conflicts: data.conflicts
        });
        return;
      }
      if (!res.ok) {
        alert(data.error || "Failed to save availability.");
        return;
      }
      setConflictModal(null);
      setMsg("Weekly working hours & slot durations updated.");
    } finally {
      setSaving(false);
    }
  }

  async function addBlock(e?: React.FormEvent, force = false) {
    if (e) e.preventDefault();
    if (!blockedDate || !reason.trim()) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_block",
          doctorId,
          force,
          block: {
            blockedDate,
            isFullDay,
            startTime: isFullDay ? undefined : startTime,
            endTime: isFullDay ? undefined : endTime,
            reason,
            type: blockType
          }
        })
      });
      const data = await res.json();
      if (res.status === 409 && data.conflicts) {
        setConflictModal({
          action: "add_block",
          warning: data.warning,
          conflicts: data.conflicts
        });
        return;
      }
      if (!res.ok) {
        alert(data.error || "Unable to add blocked period.");
        return;
      }
      setBlocks((prev) => [...prev, data.block]);
      setConflictModal(null);
      setReason("");
      setBlockedDate("");
      setMsg("Blocked period / leave added.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock(blockId: string) {
    await fetch("/api/doctor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_block",
        doctorId,
        blockId
      })
    });
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Availability &amp; Leave Schedule — {doctorName}
        </h1>
        <p className="text-sm text-slate-600">
          Configure weekly working hours, slot durations, breaks, and blocked dates. Existing confirmed bookings trigger a conflict warning before changes are saved.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {msg}
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="card-clinical p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            Weekly Working Hours &amp; Breaks
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSchedules(false)}
            className="btn-primary"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Weekly Schedule"}</span>
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {schedules.map((s) => (
            <div
              key={s.dayOfWeek}
              className="grid items-center gap-3 rounded-xl border border-slate-200 p-3.5 md:grid-cols-12"
            >
              <label className="flex items-center gap-2.5 font-semibold text-slate-900 md:col-span-2">
                <input
                  type="checkbox"
                  checked={s.isAvailable}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, { isAvailable: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span className="text-sm">{DAYS[s.dayOfWeek]}</span>
              </label>

              <div className="flex items-center gap-2 md:col-span-3">
                <input
                  type="time"
                  disabled={!s.isAvailable}
                  value={s.startTime}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, { startTime: e.target.value })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="time"
                  disabled={!s.isAvailable}
                  value={s.endTime}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, { endTime: e.target.value })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-4">
                <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                  Break:
                </span>
                <input
                  type="time"
                  disabled={!s.isAvailable}
                  value={s.breakStart || ""}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, { breakStart: e.target.value })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="time"
                  disabled={!s.isAvailable}
                  value={s.breakEnd || ""}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, { breakEnd: e.target.value })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-3">
                <input
                  type="number"
                  min={0}
                  max={200}
                  disabled={!s.isAvailable}
                  placeholder="AM Auto"
                  title="Optional Morning Max Queue Capacity (blank = auto 15m/patient)"
                  value={s.morningCapacityOverride ?? ""}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, {
                      morningCapacityOverride: e.target.value
                        ? Number(e.target.value)
                        : undefined
                    })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  max={200}
                  disabled={!s.isAvailable}
                  placeholder="PM Auto"
                  title="Optional Evening Max Queue Capacity (blank = auto 15m/patient)"
                  value={s.eveningCapacityOverride ?? ""}
                  onChange={(e) =>
                    updateDay(s.dayOfWeek, {
                      eveningCapacityOverride: e.target.value
                        ? Number(e.target.value)
                        : undefined
                    })
                  }
                  className="input-clinical py-1.5 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block Dates / Holidays / Leave */}
      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={(e) => addBlock(e, false)}
          className="card-clinical space-y-4 p-6 lg:col-span-5"
        >
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarOff className="h-5 w-5 text-brand-600" />
            <h2>Block Date / Add Leave</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Date *
              </label>
              <input
                type="date"
                required
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Type
              </label>
              <select
                value={blockType}
                onChange={(e) =>
                  setBlockType(e.target.value as BlockedSlotType)
                }
                className="input-clinical"
              >
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
                <option value="blocked">Blocked Period</option>
                <option value="break">Special Break</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isFullDay}
              onChange={(e) => setIsFullDay(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600"
            />
            <span>Full Day Unavailable</span>
          </label>

          {!isFullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  From
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  To
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-clinical"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Reason / Note *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical conference / OT rounds"
              className="input-clinical"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            Add Blocked Slot / Leave
          </button>
        </form>

        <div className="card-clinical p-6 lg:col-span-7">
          <h2 className="text-lg font-bold text-slate-900">
            Scheduled Holidays &amp; Blocked Periods
          </h2>
          <div className="mt-4 space-y-2.5">
            {blocks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No upcoming blocked dates or leaves configured.
              </p>
            ) : (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {b.blockedDate}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                        {b.type}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {b.isFullDay
                        ? "Full day"
                        : `${b.startTime} – ${b.endTime}`}{" "}
                      • {b.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBlock(b.id)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    title="Remove block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Conflict Warning Dialog */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card-clinical w-full max-w-lg p-6">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Existing Confirmed Bookings Conflict
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {conflictModal.warning}
                </p>
              </div>
            </div>

            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-amber-50 p-3 text-xs">
              {conflictModal.conflicts.map((c) => (
                <li key={c.id} className="flex justify-between font-medium">
                  <span>
                    {c.bookingRef} — {c.patientName}
                  </span>
                  <span>
                    {c.appointmentDate} {c.slotStart}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConflictModal(null)}
                className="btn-secondary"
              >
                Cancel Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  conflictModal.action === "save_schedules"
                    ? saveSchedules(true)
                    : addBlock(undefined, true)
                }
                className="btn-primary bg-amber-600 hover:bg-amber-700"
              >
                Save Anyway (Keep Existing Bookings)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
