"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { ScrollReveal } from "@/components/MotionPrimitives";

const PILLARS = [
  {
    num: "01",
    title: "Patient-First Clinical Care",
    summary:
      "Unhurried specialist consultations where diagnosis, reports, and treatment plans are explained clearly.",
    icon: Stethoscope
  },
  {
    num: "02",
    title: "Real-Time Slot Availability",
    summary:
      "Live doctor schedules with automatic break/holiday exclusions and temporary checkout slot locks.",
    icon: CalendarCheck
  },
  {
    num: "03",
    title: "Verified Quality & Transparency",
    summary:
      "Upfront consultation fees, server-verified Razorpay checkout, and instant multi-channel receipts.",
    icon: ShieldCheck
  }
];

export function AboutPillarsSection({
  hospitalName,
  aboutIntro
}: {
  hospitalName: string;
  aboutIntro: string;
}) {
  const [activeIdx, setActiveIdx] = useState(1);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid items-end gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                ABOUT {hospitalName.split(" ")[0].toUpperCase()}
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Committed to Delivering Exceptional Healthcare Backed by Clinical Precision
              </h2>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm leading-relaxed text-slate-600">
                {aboutIntro}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12">
          {/* Left Featured Photo Card */}
          <ScrollReveal direction="left" className="lg:col-span-6">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/facility-room.jpg"
                alt="AuraCare Modern Hospital Suite"
                className="h-[340px] w-full object-cover transition duration-700 group-hover:scale-105 sm:h-[380px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div className="text-white">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                    NABH Standards
                  </span>
                  <p className="mt-1.5 text-base font-bold">
                    Modern Outpatient &amp; Private Care Suites
                  </p>
                </div>
                <Link
                  href="/about"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-md transition hover:bg-sky-50"
                >
                  <span>About Us</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#0b71c7]" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Interactive Vertical Pillar Switcher */}
          <ScrollReveal direction="right" className="lg:col-span-6">
            <div className="relative space-y-4 pl-6 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-0.5 before:bg-slate-200">
              {PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                const active = activeIdx === idx;
                return (
                  <button
                    key={pillar.num}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
                      active
                        ? "border-sky-300 bg-[#f0f7ff] shadow-md shadow-sky-900/5"
                        : "border-slate-200/80 bg-white hover:border-sky-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`-ml-9 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-sm transition-all duration-300 ${
                        active
                          ? "scale-110 bg-[#0b71c7] text-white ring-4 ring-sky-200/70"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {pillar.title}
                        </h3>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {pillar.num}
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 text-xs leading-relaxed transition-all duration-300 sm:text-sm ${
                          active ? "text-slate-700" : "text-slate-500"
                        }`}
                      >
                        {pillar.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
