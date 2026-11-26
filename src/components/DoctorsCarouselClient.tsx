"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Doctor } from "@/types/hospital";

export interface HomeDoctorCardItem extends Doctor {
  availableToday: boolean;
}

export function DoctorsCarouselClient({
  doctors
}: {
  doctors: HomeDoctorCardItem[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [perView, setPerView] = useState(1);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function updatePerView() {
      if (window.innerWidth >= 1024) {
        setPerView(3);
      } else if (window.innerWidth >= 640) {
        setPerView(2);
      } else {
        setPerView(1);
      }
    }
    updatePerView();
    window.addEventListener("resize", updatePerView);
    return () => window.removeEventListener("resize", updatePerView);
  }, []);

  const maxIdx = Math.max(0, doctors.length - perView);

  useEffect(() => {
    setActiveIdx((prev) => Math.min(prev, maxIdx));
  }, [maxIdx]);

  function prev() {
    setActiveIdx((i) => (i <= 0 ? maxIdx : i - 1));
  }

  function next() {
    setActiveIdx((i) => (i >= maxIdx ? 0 : i + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== "number") return;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartX.current = null;
  }

  const totalStops = maxIdx + 1;
  const slidePercent = 100 / perView;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0b71c7]">
          OUR DOCTORS
        </p>
        <h2 className="mt-1.5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
          Consult Our Specialists
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          A team of experienced and compassionate doctors, committed to your health and well-being.
        </p>
        <Link
          href="/doctors"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        >
          <span>View All Doctors</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#0b71c7]" />
        </Link>
      </div>

      <div className="min-w-0 lg:col-span-8">
        {/* Slider Viewport */}
        <div
          className="-mx-2 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${activeIdx * slidePercent}%)`
            }}
          >
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="box-border w-full shrink-0 px-2 sm:w-1/2 lg:w-1/3"
              >
                <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div>
                    <div className="relative flex h-56 items-end justify-center overflow-hidden rounded-xl bg-[#eef6fc] pt-2 sm:h-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.photoUrl}
                        alt={doc.fullName}
                        className={`h-full w-full object-contain object-bottom ${
                          doc.photoUrl.includes("hero-doctor")
                            ? "mix-blend-multiply"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          doc.availableToday
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doc.availableToday ? "Available Today" : "By Schedule"}
                      </span>
                      <h3 className="mt-1.5 truncate text-sm font-extrabold text-slate-900">
                        {doc.fullName}
                      </h3>
                      <p className="truncate text-[11px] font-medium text-slate-500">
                        {doc.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <div className="mb-3 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {doc.experienceYears}+ years experience
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        ₹{doc.consultationFee}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/doctors/${doc.slug}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-sky-300 hover:text-[#0b71c7]"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/book?doctor=${doc.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-[#0b71c7] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#085ba1]"
                      >
                        Book Slot
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Navigation Bar */}
        {totalStops > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalStops }).map((_, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Show doctor slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-6 bg-[#0b71c7]"
                        : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs font-bold text-slate-500">
                {activeIdx + 1} / {totalStops}
              </span>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous doctor"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-[#0b71c7]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next doctor"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b71c7] text-white shadow-sm transition hover:bg-[#085ba1]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
