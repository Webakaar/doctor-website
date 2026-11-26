"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Quote,
  ShieldCheck,
  Star,
  Stethoscope
} from "lucide-react";
import type { Doctor, Testimonial } from "@/types/hospital";
import { AnimatedCounter, ScrollReveal } from "@/components/MotionPrimitives";

const FAQS = [
  {
    q: "How do I book a doctor appointment online?",
    a: "Click 'Book Doctor', select your medical service or specialist, pick an available date and time slot, enter patient details, and confirm with Razorpay. You immediately receive a unique booking reference."
  },
  {
    q: "How does the platform prevent double-booking?",
    a: "Every slot is verified against doctor schedules, breaks, and leaves. When you proceed to checkout, a temporary slot hold reserves your slot and our server re-verifies availability atomically before confirmation."
  },
  {
    q: "What happens if my Razorpay payment fails or is cancelled?",
    a: "Failed or abandoned checkouts never create a confirmed appointment—the temporary slot hold is immediately released so you or other patients can re-book cleanly."
  },
  {
    q: "Can I cancel an appointment and receive a refund?",
    a: "Yes. Registered patients can cancel eligible appointments directly from their Patient Dashboard within the hospital's cancellation window, with automatic refund tracking."
  },
  {
    q: "Will I receive booking updates on WhatsApp, SMS, and Email?",
    a: "Yes. Verified bookings automatically trigger Email (Nodemailer), SMS (MSG91), and WhatsApp notifications according to the hospital's notification preferences."
  }
];

const JOURNEY_STEPS = [
  {
    step: "Step 01",
    title: "Select Service or Specialist",
    desc: "Browse medical departments or compare doctor profiles, fees, and experience."
  },
  {
    step: "Step 02",
    title: "Pick Live Date & Time Slot",
    desc: "View real-time OPD slots with automatic break and holiday exclusions."
  },
  {
    step: "Step 03",
    title: "Server-Verified Razorpay Checkout",
    desc: "Pay consultation fees securely while your slot is temporarily held."
  },
  {
    step: "Step 04",
    title: "Instant Confirmation & Reminders",
    desc: "Get your booking reference receipt plus Email, SMS, and WhatsApp updates."
  }
];

export function InteractiveShowcases({
  doctors,
  testimonials,
  activeDoctorsCount,
  servicesCount
}: {
  doctors: Doctor[];
  testimonials: Testimonial[];
  activeDoctorsCount: number;
  servicesCount: number;
}) {
  const [spotIdx, setSpotIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const spotlightDoc = doctors[spotIdx % doctors.length];
  const activeQuote = testimonials[quoteIdx % Math.max(testimonials.length, 1)];

  return (
    <>
      {/* 1. Specialist Spotlight Carousel ("Real Clinical Expertise") */}
      {spotlightDoc && (
        <section className="bg-slate-50/70 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                    Specialist Spotlight
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    Consult Verified Senior Doctors
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSpotIdx((i) => (i - 1 + doctors.length) % doctors.length)
                    }
                    aria-label="Previous specialist"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-[#0b71c7]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotIdx((i) => (i + 1) % doctors.length)}
                    aria-label="Next specialist"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06213e] text-white shadow-sm transition hover:bg-[#0b71c7]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            <div
              key={spotlightDoc.id}
              className="animate-fade-slide mt-8 grid items-center gap-8 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10 lg:grid-cols-12"
            >
              <div className="space-y-5 lg:col-span-7">
                <p className="text-3xl font-black uppercase tracking-tight text-slate-200 sm:text-5xl">
                  {spotlightDoc.specialty}
                </p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        {spotlightDoc.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-[#0b71c7]">
                        {spotlightDoc.qualification}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      ₹{spotlightDoc.consultationFee} Fee
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {spotlightDoc.biography}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    {spotlightDoc.experienceYears}+ years clinical experience •{" "}
                    {spotlightDoc.slotDurationMins} min consultation slots
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/book?doctor=${spotlightDoc.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#06213e] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#0b71c7]"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    <span>Book Slot with {spotlightDoc.fullName.split(" ")[1] || "Doctor"}</span>
                  </Link>
                  <Link
                    href={`/doctors/${spotlightDoc.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:border-sky-300"
                  >
                    <span>View Full Schedule</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border-4 border-sky-50 bg-[#eef6fc] pt-3 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spotlightDoc.photoUrl}
                    alt={spotlightDoc.fullName}
                    className={`h-[290px] w-full object-contain object-bottom sm:h-[330px] ${
                      spotlightDoc.photoUrl.includes("hero-doctor")
                        ? "mix-blend-multiply"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Overlapping Impact Stats & Dark Navy Trust Banner */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <ScrollReveal direction="left" className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/facility-room.jpg"
                  alt="Hospital Clinical Suites"
                  className="h-72 w-full object-cover sm:h-80"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-extrabold text-[#0b71c7]">
                    <AnimatedCounter target={Math.max(activeDoctorsCount, 6)} suffix="+" />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    Senior Specialists
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-extrabold text-[#0b71c7]">
                    <AnimatedCounter target={servicesCount} suffix="+" />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    Departments
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-extrabold text-[#0b71c7]">
                    <AnimatedCounter target={98} suffix="%" />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    Satisfaction
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-span-6">
              <div className="rounded-3xl bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] p-8 text-white shadow-2xl sm:p-10">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  Built for Reliability
                </span>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                  Dedicated to Clinical Safety &amp; Effortless Access
                </h2>
                <div className="mt-6 space-y-4">
                  {[
                    {
                      title: "Atomic Slot Lock Protection",
                      desc: "Temporary checkout holds prevent duplicate appointments for the same doctor and time."
                    },
                    {
                      title: "Server-Verified Razorpay Payments",
                      desc: "HMAC-SHA256 verification and webhook reconciliation keep every booking accurate."
                    },
                    {
                      title: "Role-Scoped Patient, Doctor & Admin Portals",
                      desc: "Doctors see only their assigned patients; patients manage cancellations in one click."
                    }
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-sky-100/80">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/book"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-[#06213e] shadow-md transition hover:bg-sky-50"
                >
                  <span>Book Appointment</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 3. Interactive FAQ Accordion */}
      <section className="relative overflow-hidden bg-[#f4f9ff] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <span className="inline-flex rounded-full bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7] shadow-sm">
              Patient Guide
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Everything You Need to Know
            </h2>
          </ScrollReveal>

          <div className="mt-8 space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg sm:p-8">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? "border-sky-200 bg-sky-50/50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-slate-900">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#0b71c7] transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="animate-fade-slide px-5 pb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. 98% Satisfaction Collage + Animated Testimonial Slider + Reviews Marquee */}
      {activeQuote && (
        <section className="overflow-hidden bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              {/* Left Avatar Collage + 98% Badge */}
              <ScrollReveal direction="left" className="lg:col-span-5">
                <div className="relative mx-auto flex h-72 max-w-sm items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/doctors/dr-arjun.jpg"
                    alt="Doctor"
                    className="animate-float-slow absolute right-8 top-0 h-32 w-32 rounded-full border-4 border-white object-cover object-top shadow-lg"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/doctors/dr-meera.jpg"
                    alt="Doctor"
                    className="animate-float-delayed absolute bottom-4 left-4 h-24 w-24 rounded-full border-4 border-white object-cover object-top shadow-lg"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/doctors/dr-rohan.jpg"
                    alt="Doctor"
                    className="animate-float-slow absolute bottom-2 right-4 h-24 w-24 rounded-full border-4 border-white object-cover object-top shadow-lg"
                  />
                  <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-white bg-[#0b71c7] text-white shadow-2xl">
                    <span className="text-3xl font-black">98%</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-sky-100">
                      Satisfaction
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right Quote Slider */}
              <div className="lg:col-span-7">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  Patient Experiences
                </span>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                  Trusted by Families Every Day
                </h2>

                <div
                  key={activeQuote.id}
                  className="animate-fade-slide mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-7"
                >
                  <div className="flex items-center justify-between">
                    <Quote className="h-7 w-7 text-[#0b71c7]" />
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: activeQuote.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-base font-medium leading-relaxed text-slate-700">
                    &ldquo;{activeQuote.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {activeQuote.patientName}
                      </p>
                      <p className="text-xs font-semibold text-[#0b71c7]">
                        {activeQuote.department}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {testimonials.map((t, i) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setQuoteIdx(i)}
                          aria-label={`View testimonial ${i + 1}`}
                          className={`h-2.5 rounded-full transition-all ${
                            quoteIdx % testimonials.length === i
                              ? "w-7 bg-[#0b71c7]"
                              : "w-2.5 bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continuous Dual-Row Patient Reviews Marquee */}
          <div className="mt-14 space-y-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="animate-marquee gap-5 px-4">
              {[...testimonials, ...testimonials].map((rev, idx) => (
                <div
                  key={`rev-row1-${rev.id}-${idx}`}
                  className="flex w-[330px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md sm:w-[370px]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0b71c7]">
                        {rev.department}
                      </span>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, sIdx) => (
                          <Star key={sIdx} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      &ldquo;{rev.quote}&rdquo;
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#06213e] text-[11px] font-extrabold text-white">
                        {rev.patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {rev.patientName}
                        </p>
                        <p className="text-[10px] font-medium text-emerald-700">
                          Verified Patient Visit
                        </p>
                      </div>
                    </div>
                    <Quote className="h-4 w-4 text-sky-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="animate-marquee-reverse gap-5 px-4">
              {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map(
                (rev, idx) => (
                  <div
                    key={`rev-row2-${rev.id}-${idx}`}
                    className="flex w-[330px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md sm:w-[370px]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                          {rev.department}
                        </span>
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, sIdx) => (
                            <Star key={sIdx} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        &ldquo;{rev.quote}&rdquo;
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b71c7] text-[11px] font-extrabold text-white">
                          {rev.patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {rev.patientName}
                          </p>
                          <p className="text-[10px] font-medium text-emerald-700">
                            Verified Patient Visit
                          </p>
                        </div>
                      </div>
                      <Quote className="h-4 w-4 text-sky-300" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. Wide Team Spotlight Banner + 4-Step Care Journey Timeline */}
      <section className="bg-[#f3f8fe] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  Our Medical Team
                </span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Find the Right Specialist &amp; Reserve Your Visit in Under 2 Minutes
                </h2>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-2 rounded-full bg-[#06213e] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b71c7]"
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>Explore All Doctors</span>
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0b71c7]" />
                  <span>Book Now</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  doc: doctors[0],
                  img: "/images/doctors/dr-arjun.jpg",
                  blend: false
                },
                {
                  doc: doctors[1],
                  img: "/images/doctors/dr-meera.jpg",
                  blend: false
                },
                {
                  doc: doctors[2],
                  img: "/images/doctors/dr-rohan.jpg",
                  blend: false
                },
                {
                  doc: doctors[3],
                  img: "/images/hero-doctor.jpg",
                  blend: true
                }
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.doc ? `/doctors/${item.doc.slug}` : "/doctors"}
                  className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-[#eef6fc] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="h-56 overflow-hidden pt-2 sm:h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={item.doc?.fullName || "Specialist"}
                      className={`h-full w-full object-contain object-bottom transition duration-500 group-hover:scale-105 ${
                        item.blend ? "mix-blend-multiply" : ""
                      }`}
                    />
                  </div>
                  <div className="border-t border-sky-100 bg-white/95 px-3.5 py-3 backdrop-blur">
                    <p className="truncate text-xs font-extrabold text-slate-900 sm:text-sm">
                      {item.doc?.fullName || "Senior Specialist"}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-[#0b71c7]">
                      {item.doc?.specialty || "Consultant"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 4-Step Care Journey Timeline */}
          <div className="mt-16 grid items-start gap-10 lg:grid-cols-12">
            <ScrollReveal className="lg:col-span-5">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7] shadow-sm">
                Booking Workflow
              </span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900">
                Our Simple Process to{" "}
                <span className="text-[#0b71c7]">Instant Care</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Built around speed and clinical clarity—no waiting on phone lines, no duplicate slot conflicts, and transparent consultation fees.
              </p>
              <Link
                href="/book"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#06213e] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#0b71c7]"
              >
                <span>Start Booking Now</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>

            <div className="space-y-4 lg:col-span-7">
              {JOURNEY_STEPS.map((s, idx) => (
                <ScrollReveal key={s.step} delayMs={idx * 75} direction="up">
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e0f2fe] font-mono text-xs font-extrabold text-[#0b71c7]">
                      0{idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b71c7]">
                        {s.step}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
