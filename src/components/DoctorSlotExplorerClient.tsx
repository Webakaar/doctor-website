"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock, Loader2 } from "lucide-react";
import type { TimeSlotOption } from "@/lib/slots";
import { formatTime12h } from "@/lib/slots";

function getUpcomingDays(count: number) {
  const list = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
    list.push({
      dateStr,
      dayLabel:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-IN", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      })
    });
  }
  return list;
}

export function DoctorSlotExplorerClient({
  doctorId,
  initialDate,
  initialSlots
}: {
  doctorId: string;
  initialDate: string;
  initialSlots: TimeSlotOption[];
}) {
  const days = useMemo(() => getUpcomingDays(7), []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState<TimeSlotOption[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<string>(
    initialSlots.find((s) => s.available)?.startTime || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate === initialDate) {
      setSlots(initialSlots);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/slots?doctorId=${doctorId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const nextSlots: TimeSlotOption[] = data.slots || [];
          setSlots(nextSlots);
          setSelectedSlot(
            nextSlots.find((s) => s.available)?.startTime || ""
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, selectedDate, initialDate, initialSlots]);

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Live Slot Explorer</span>
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            Select Date &amp; Available Time Slot
          </h2>
          <p className="text-xs text-slate-500">
            Pick a day below to inspect real-time openings and jump directly to checkout.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {availableSlots.length} Open Slots
        </span>
      </div>

      {/* Interactive 7-Day Date Selector */}
      <div className="mt-5 flex w-full max-w-full gap-2.5 overflow-x-auto pb-2">
        {days.map((d) => {
          const active = selectedDate === d.dateStr;
          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => setSelectedDate(d.dateStr)}
              className={`min-w-[92px] shrink-0 rounded-2xl border px-3.5 py-2.5 text-center transition-all duration-200 ${
                active
                  ? "border-[#0b71c7] bg-[#0b71c7] text-white shadow-md shadow-sky-900/15"
                  : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase opacity-80">
                {d.dayLabel}
              </span>
              <span className="mt-0.5 block text-sm font-extrabold">
                {d.dateLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slots Grid */}
      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#0b71c7]" />
            <span>Checking live OPD availability...</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No available OPD slots on {selectedDate}. Try another date above.
          </div>
        ) : (
          <div className="animate-fade-slide grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {availableSlots.map((slot) => {
              const isChosen = selectedSlot === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedSlot(slot.startTime)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isChosen
                      ? "border-[#06213e] bg-[#06213e] text-white shadow-sm"
                      : "border-sky-200 bg-[#f4f9ff] text-[#0b71c7] hover:border-[#0b71c7] hover:bg-sky-100"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 opacity-80" />
                  <span>{formatTime12h(slot.startTime)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Instant Continue CTA */}
      {selectedSlot && availableSlots.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200/80 bg-[#f0f7ff] px-5 py-4">
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-600">Selected: </span>
            <strong className="font-extrabold text-slate-900">
              {selectedDate} at {formatTime12h(selectedSlot)}
            </strong>
          </div>
          <Link
            href={`/book?doctor=${doctorId}&date=${selectedDate}&slot=${selectedSlot}`}
            className="group inline-flex items-center gap-2 rounded-full bg-[#0b71c7] py-2 pl-5 pr-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#06213e]"
          >
            <span>Continue with Selected Slot</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0b71c7] transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
