"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  GraduationCap,
  Search,
  Stethoscope,
  X
} from "lucide-react";
import type { Doctor, DoctorSchedule, Service } from "@/types/hospital";

export function DoctorsCatalogClient({
  doctors,
  services,
  schedules
}: {
  doctors: Doctor[];
  services: Service[];
  schedules: DoctorSchedule[];
}) {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);

  const todayDow = new Date().getDay();

  const isDoctorAvailableToday = (doctorId: string) =>
    Boolean(
      schedules.find((s) => s.doctorId === doctorId && s.dayOfWeek === todayDow)
        ?.isAvailable
    );

  const filtered = doctors.filter((d) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.qualification.toLowerCase().includes(q);
    const matchesService =
      serviceFilter === "all" || d.serviceIds.includes(serviceFilter);
    const matchesAvail =
      !onlyAvailableToday || isDoctorAvailableToday(d.id);
    return matchesSearch && matchesService && matchesAvail;
  });

  return (
    <div className="space-y-6">
      {/* Elevated Filter & Specialty Pill Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, qualification, or speciality..."
              className="input-clinical rounded-full py-2.5 pl-11 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlyAvailableToday((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${
              onlyAvailableToday
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                onlyAvailableToday
                  ? "animate-pulse bg-emerald-500"
                  : "bg-slate-400"
              }`}
            />
            <span>Available Today Only</span>
          </button>

          <span className="shrink-0 text-xs font-bold text-slate-500">
            {filtered.length} Specialist{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Interactive Department Pills */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setServiceFilter("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              serviceFilter === "all"
                ? "bg-[#06213e] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#0b71c7]"
            }`}
          >
            All Departments
          </button>
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceFilter(s.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                serviceFilter === s.id
                  ? "bg-[#0b71c7] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#0b71c7]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Tall Portrait Doctor Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-bold text-slate-800">
            No specialists match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setServiceFilter("all");
              setOnlyAvailableToday(false);
            }}
            className="mt-4 rounded-full bg-[#0b71c7] px-5 py-2 text-xs font-bold text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const availToday = isDoctorAvailableToday(doc.id);
            const docServices = services.filter((s) =>
              doc.serviceIds.includes(s.id)
            );
            const isHeroWhiteBg = doc.photoUrl.includes("hero-doctor");

            return (
              <div
                key={doc.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/10"
              >
                <div>
                  {/* Tall Framed Studio Portrait */}
                  <div className="relative h-60 overflow-hidden rounded-2xl bg-[#eef6fc] pt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={doc.photoUrl}
                      alt={doc.fullName}
                      className={`h-full w-full object-contain object-bottom transition duration-500 group-hover:scale-105 ${
                        isHeroWhiteBg ? "mix-blend-multiply" : ""
                      }`}
                    />

                    {/* Top Left Availability Badge */}
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${
                        availToday
                          ? "bg-white/95 text-emerald-800"
                          : "bg-white/90 text-slate-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          availToday
                            ? "animate-pulse bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {availToday ? "Available Today" : "By Schedule"}
                    </span>

                    {/* Top Right Fee Badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-[#06213e]/90 px-3 py-1 text-xs font-extrabold text-white shadow-sm backdrop-blur">
                      ₹{doc.consultationFee}
                    </span>
                  </div>

                  {/* Doctor Details */}
                  <div className="mt-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#0b71c7]">
                      {doc.specialty}
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                      {doc.fullName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#0b71c7]" />
                      <span className="truncate">{doc.qualification}</span>
                    </p>
                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {doc.biography}
                    </p>

                    {docServices.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {docServices.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-[#0b71c7]"
                          >
                            <Stethoscope className="h-3 w-3" />
                            <span>{s.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mb-3.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {doc.experienceYears}+ years experience
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#0b71c7]" />
                      {doc.slotDurationMins} min slot
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/doctors/${doc.slug}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-[#0b71c7]"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/book?doctor=${doc.id}`}
                      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#06213e] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b71c7]"
                    >
                      <span>Book Slot</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
