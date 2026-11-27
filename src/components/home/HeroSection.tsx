"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarCheck,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Star
} from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";
import { KineticHeroHeadline } from "@/components/MotionPrimitives";
import { ClinicalDatePicker } from "@/components/ClinicalDatePicker";

export function HeroSection({
  heroSubtitle,
  emergencyPhone,
  services
}: {
  heroSubtitle: string;
  emergencyPhone: string;
  services: Service[];
  doctors?: Doctor[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [minDate, setMinDate] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
    setMinDate(todayStr);
    setAppointmentDate(todayStr);
  }, []);

  function handleQuickBook(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (serviceId) params.set("service", serviceId);
    if (appointmentDate) params.set("date", appointmentDate);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <section className="relative overflow-x-clip bg-gradient-to-b from-[#eef6ff] via-[#f7fbff] to-white pb-12 pt-8 sm:pt-12">
      {/* Giant Kinetic Background Watermark Typography */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-10 flex select-none justify-center overflow-hidden"
      >
        <span className="text-[18vw] font-black uppercase leading-none tracking-tighter text-[#dceaf9]/80 sm:text-[13rem]">
          MEDICINE
        </span>
      </div>

      {/* Soft Radial Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Editorial Copy */}
          <div className="z-10 lg:col-span-6">
            <KineticHeroHeadline />

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              {heroSubtitle}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#06213e] py-2 pl-6 pr-2 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b71c7]"
              >
                <span>Book Doctor</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#06213e] transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/doctors"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-6 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:border-sky-400 hover:text-[#0b71c7]"
              >
                <span>Meet Specialists</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Social Proof Pill */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2.5">
                {[
                  "/images/doctors/dr-arjun.jpg",
                  "/images/doctors/dr-meera.jpg",
                  "/images/doctors/dr-rohan.jpg"
                ].map((src, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={src}
                    alt="Specialist"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover object-top shadow-sm"
                  />
                ))}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9 / 5 Patient Rating</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Verified specialists &amp; zero double-booking
                </p>
              </div>
            </div>
          </div>

          {/* Right Layered 3-Doctor Composition */}
          <div className="relative z-10 lg:col-span-6">
            <div className="relative mx-auto flex h-[360px] max-w-xl items-end justify-center sm:h-[420px]">
              {/* Left Doctor */}
              <div className="animate-float-delayed absolute bottom-0 left-2 z-10 h-[76%] w-[38%] overflow-hidden rounded-t-3xl border-4 border-white bg-[#eef6fc] shadow-xl sm:left-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/doctors/dr-meera.jpg"
                  alt="Dr. Kavya Nair"
                  className="h-full w-full object-cover object-top"
                />
              </div>

              {/* Right Doctor */}
              <div className="animate-float-delayed absolute bottom-0 right-2 z-10 h-[78%] w-[38%] overflow-hidden rounded-t-3xl border-4 border-white bg-[#eef6fc] shadow-xl sm:right-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/doctors/dr-rohan.jpg"
                  alt="Dr. Rohan Kulkarni"
                  className="h-full w-full object-cover object-top"
                />
              </div>

              {/* Center Hero Doctor */}
              <div className="animate-float-slow relative z-20 h-[92%] w-[48%] overflow-hidden rounded-t-3xl border-4 border-white bg-white shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero-doctor.jpg"
                  alt="AuraCare Chief Specialist"
                  className="h-full w-full object-cover object-top"
                />
              </div>

              {/* Floating Live Status Badge */}
              <div className="animate-float-slow absolute bottom-5 left-4 z-30 flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur sm:left-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Live OPD Queue Windows
                  </p>
                  <p className="text-[10px] font-medium text-emerald-700">
                    Instant Queue Token &amp; Updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Interactive Quick-Action Dock */}
        <form
          onSubmit={handleQuickBook}
          className="relative z-20 mt-4 grid gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-xl shadow-sky-900/10 backdrop-blur-md md:grid-cols-3"
        >
          {/* Tile 1: Ice Blue */}
          <div className="rounded-2xl bg-[#d6ecff] p-4 transition hover:bg-[#cae4fc]">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#06213e]">
              <HeartPulse className="h-3.5 w-3.5 text-[#0b71c7]" />
              <span>1. Select Speciality</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#0b71c7] focus:outline-none"
            >
              <option value="">All Clinical Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tile 2: Custom Branded Date Picker */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#06213e]">
              <Calendar className="h-3.5 w-3.5 text-[#0b71c7]" />
              <span>2. Preferred Date</span>
            </label>
            <ClinicalDatePicker
              value={appointmentDate}
              minDate={minDate}
              onChange={setAppointmentDate}
            />
          </div>

          {/* Tile 3: Warm Buttercream Gold CTA */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#fef0c3] p-4">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide text-amber-950">
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-amber-800" />
                <span>3. OPD Queue Window</span>
              </span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px]">
                Live Token
              </span>
            </div>
            <button
              type="submit"
              className="group mt-2 inline-flex w-full items-center justify-between rounded-xl bg-[#06213e] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b71c7]"
            >
              <span>Check Booking Windows</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </form>

        {/* Bottom Warm Emergency Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-[#fff9e6] px-5 py-3 text-xs">
          <div className="flex items-center gap-2.5 font-semibold text-amber-950">
            <PhoneCall className="h-4 w-4 text-amber-700" />
            <span>
              24×7 Emergency &amp; Trauma Triage Helpline:{" "}
              <strong className="font-extrabold">{emergencyPhone}</strong>
            </span>
          </div>
          <Link
            href="/contact"
            className="font-bold text-[#0b71c7] hover:underline"
          >
            Hospital Directions &amp; OPD Timings &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
