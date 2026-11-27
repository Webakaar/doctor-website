"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function ClinicalDatePicker({
  value,
  minDate,
  onChange
}: {
  value: string;
  minDate: string;
  onChange: (dateStr: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const todayStr = minDate || toDateStr(new Date());

  const twoWeekDays = useMemo(() => {
    const start = parseDateStr(todayStr);
    const list = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push({
        index: i,
        dateStr: toDateStr(d),
        weekday:
          i === 0
            ? "Today"
            : i === 1
            ? "Tmrw"
            : d.toLocaleDateString("en-IN", { weekday: "short" }),
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString("en-IN", { month: "short" })
      });
    }
    return list;
  }, [todayStr]);

  const tomorrowStr = twoWeekDays[1]?.dateStr || todayStr;
  const rangeLabel =
    twoWeekDays.length > 0
      ? `${twoWeekDays[0].dayNum} ${twoWeekDays[0].monthShort} – ${
          twoWeekDays[twoWeekDays.length - 1].dayNum
        } ${twoWeekDays[twoWeekDays.length - 1].monthShort}`
      : "Next 14 Days";

  const formattedDisplay = useMemo(() => {
    if (!value) return "Select Date";
    const d = parseDateStr(value);
    const label = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    if (value === todayStr) return `Today • ${label}`;
    if (value === tomorrowStr) return `Tomorrow • ${label}`;
    return label;
  }, [value, todayStr, tomorrowStr]);

  function selectDate(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-900 transition hover:border-sky-300 focus:border-[#0b71c7] focus:outline-none"
      >
        <span className="truncate">{formattedDisplay}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180 text-[#0b71c7]" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose appointment date within next 2 weeks"
          className="animate-fade-slide absolute left-0 top-full z-50 mt-2.5 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-sky-950/20"
        >
          {/* Clinical Header */}
          <div className="bg-gradient-to-r from-[#06213e] to-[#0b4b8a] px-4 py-3.5 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15">
                  <Calendar className="h-3.5 w-3.5 text-sky-200" />
                </span>
                <div>
                  <span className="block text-xs font-extrabold tracking-tight">
                    Next 2 Weeks
                  </span>
                  <span className="block text-[10px] font-medium text-sky-200">
                    {rangeLabel}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => selectDate(todayStr)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    value === todayStr
                      ? "bg-white text-[#06213e]"
                      : "bg-white/15 text-sky-100 hover:bg-white/25"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => selectDate(tomorrowStr)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    value === tomorrowStr
                      ? "bg-white text-[#06213e]"
                      : "bg-white/15 text-sky-100 hover:bg-white/25"
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>

          {/* 14-Day (2 Weeks) Grid */}
          <div className="p-3.5">
            <div className="grid grid-cols-7 gap-1.5">
              {twoWeekDays.map((item) => {
                const isSelected = item.dateStr === value;
                const isToday = item.dateStr === todayStr;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => selectDate(item.dateStr)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2 text-center transition ${
                      isSelected
                        ? "border-[#0b71c7] bg-[#0b71c7] text-white shadow-md shadow-sky-900/20"
                        : isToday
                        ? "border-[#0b71c7]/40 bg-sky-50 text-[#0b71c7] hover:bg-sky-100"
                        : "border-slate-100 bg-slate-50/70 text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-[#0b71c7]"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        isSelected ? "text-sky-100" : "text-slate-400"
                      }`}
                    >
                      {item.weekday}
                    </span>
                    <span className="mt-0.5 text-sm font-extrabold leading-none">
                      {item.dayNum}
                    </span>
                    <span
                      className={`mt-0.5 text-[9px] font-semibold ${
                        isSelected ? "text-sky-100" : "text-slate-400"
                      }`}
                    >
                      {item.monthShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
