"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock, Loader2, Users } from "lucide-react";
import type { BookingSession } from "@/types/hospital";
import type { BookingWindowOption } from "@/lib/slots";
import { formatTime12h } from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";

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
  initialWindows
}: {
  doctorId: string;
  initialDate: string;
  initialWindows: BookingWindowOption[];
}) {
  const days = useMemo(() => getUpcomingDays(14), []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [windows, setWindows] = useState<BookingWindowOption[]>(initialWindows);
  const [selectedSession, setSelectedSession] = useState<BookingSession | "">(
    initialWindows.find((w) => w.available)?.session || ""
  );
  const [loading, setLoading] = useState(false);

  const fetchWindows = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(
          `/api/slots?doctorId=${doctorId}&date=${selectedDate}`
        );
        const data = await res.json();
        const nextWindows: BookingWindowOption[] = data.windows || [];
        setWindows(nextWindows);
        setSelectedSession((prev) =>
          nextWindows.some((w) => w.session === prev && w.available)
            ? prev
            : nextWindows.find((w) => w.available)?.session || ""
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [doctorId, selectedDate]
  );

  useEffect(() => {
    if (selectedDate === initialDate) {
      setWindows(initialWindows);
      setSelectedSession(
        initialWindows.find((w) => w.available)?.session || ""
      );
      return;
    }
    fetchWindows(false);
  }, [selectedDate, initialDate, initialWindows, fetchWindows]);

  useQueueRealtime(() => fetchWindows(true), {
    enabled: Boolean(doctorId && selectedDate),
    key: `doc-explorer-${doctorId}-${selectedDate}`
  });

  const hasOpenWindow = windows.some((w) => w.available);
  const chosenWindow = windows.find((w) => w.session === selectedSession);

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Live Queue &amp; OPD Windows</span>
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            Select Date &amp; Available Booking Window
          </h2>
          <p className="text-xs text-slate-500">
            Pick Morning or Evening OPD window to reserve your queue token.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            hasOpenWindow
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {hasOpenWindow ? "Accepting Bookings" : "Closed / Full"}
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

      {/* Booking Windows Grid */}
      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#0b71c7]" />
            <span>Checking live OPD queue capacity...</span>
          </div>
        ) : windows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No OPD booking windows scheduled on {selectedDate}. Try another date above.
          </div>
        ) : (
          <div className="animate-fade-slide grid gap-3 sm:grid-cols-2">
            {windows.map((win) => {
              const isChosen = selectedSession === win.session;
              return (
                <button
                  key={win.session}
                  type="button"
                  disabled={!win.available}
                  onClick={() => setSelectedSession(win.session)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                    !win.available
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                      : isChosen
                      ? "border-[#06213e] bg-[#eef6ff] ring-2 ring-[#0b71c7]/20"
                      : "border-sky-200 bg-[#f4f9ff] hover:border-[#0b71c7]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {win.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        !win.available
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {win.available
                        ? "Available"
                        : win.reason === "full"
                        ? "Queue Full"
                        : "Closed"}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#0b71c7]">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime12h(win.startTime)} &ndash;{" "}
                      {formatTime12h(win.endTime)}
                    </span>
                  </p>

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Next Queue Token: <strong>#{win.nextQueueNumber}</strong>
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Instant Continue CTA */}
      {chosenWindow && chosenWindow.available && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200/80 bg-[#f0f7ff] px-5 py-4">
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-600">Selected: </span>
            <strong className="font-extrabold text-slate-900">
              {selectedDate} • {chosenWindow.label} (Est. Token #
              {chosenWindow.nextQueueNumber})
            </strong>
          </div>
          <Link
            href={`/book?doctor=${doctorId}&date=${selectedDate}&session=${chosenWindow.session}`}
            className="group inline-flex items-center gap-2 rounded-full bg-[#0b71c7] py-2 pl-5 pr-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#06213e]"
          >
            <span>Join Queue &amp; Book</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0b71c7] transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
