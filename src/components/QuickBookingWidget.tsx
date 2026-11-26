"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, HeartPulse, UserCheck } from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";

export function QuickBookingWidget({
  services,
  doctors
}: {
  services: Service[];
  doctors: Doctor[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const filteredDoctors = serviceId
    ? doctors.filter((d) => d.serviceIds.includes(serviceId))
    : doctors;
  const [doctorId, setDoctorId] = useState("");

  function handleStartBooking(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (serviceId) params.set("service", serviceId);
    if (doctorId) params.set("doctor", doctorId);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-sky-900/10 backdrop-blur sm:p-7">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0b71c7]">
          <CalendarCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
            Quick Appointment Booking
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Find a doctor and book your visit in just a few steps.
          </p>
        </div>
      </div>

      <form onSubmit={handleStartBooking} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Select Medical Speciality
          </label>
          <div className="relative">
            <HeartPulse className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#0b71c7]" />
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setDoctorId("");
              }}
              className="input-clinical pl-10 text-xs font-medium"
            >
              <option value="">All Specialities</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Choose a Doctor (Optional)
          </label>
          <div className="relative">
            <UserCheck className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#0b71c7]" />
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="input-clinical pl-10 text-xs font-medium"
            >
              <option value="">
                Any Available Doctor ({filteredDoctors.length})
              </option>
              {filteredDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — ₹{d.consultationFee}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0b71c7] px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition hover:bg-[#085ba1]"
        >
          <span>Check Available Slots</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
