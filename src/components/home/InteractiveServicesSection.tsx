"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";
import { ServiceIcon } from "@/components/ServiceIcon";
import { ScrollReveal } from "@/components/MotionPrimitives";

export function InteractiveServicesSection({
  services,
  doctors
}: {
  services: Service[];
  doctors: Doctor[];
}) {
  const [activeId, setActiveId] = useState(services[0]?.id || "");
  const activeService =
    services.find((s) => s.id === activeId) || services[0];

  const relatedDoctors = activeService
    ? doctors.filter((d) => d.serviceIds.includes(activeService.id))
    : [];

  return (
    <>
      <section className="relative overflow-hidden bg-[#06213e] py-16 text-white sm:py-20">
        {/* Subtle decorative circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  <Sparkles className="h-3 w-3" />
                  <span>Our Clinical Departments</span>
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Advanced Healthcare Services
                  <span className="block text-sky-300">Tailored for You</span>
                </h2>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <p className="max-w-md text-xs leading-relaxed text-sky-100/80 sm:text-sm lg:text-right">
                  Select any department below to preview clinical scope, specialists, and book an instant consultation slot.
                </p>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#06213e] shadow-sm transition hover:bg-sky-50"
                >
                  <span>View All Services</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {activeService && (
            <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-12">
              {/* Left Interactive Tab List */}
              <div className="flex flex-col justify-between gap-2.5 lg:col-span-5">
                {services.slice(0, 6).map((svc, idx) => {
                  const selected = svc.id === activeService.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setActiveId(svc.id)}
                      className={`group flex items-center justify-between rounded-2xl border px-5 py-3.5 text-left transition-all duration-200 ${
                        selected
                          ? "border-sky-400/60 bg-[#0b71c7] text-white shadow-lg shadow-sky-950/40"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`font-mono text-xs font-bold ${
                            selected ? "text-sky-200" : "text-slate-400"
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        <span className="text-sm font-bold">{svc.name}</span>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                          selected
                            ? "translate-x-0 text-white"
                            : "-translate-x-1 text-slate-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right Animated Detail Showcase Card */}
              <div
                key={activeService.id}
                className="animate-fade-slide grid items-center gap-6 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8 lg:col-span-7 lg:grid-cols-12"
              >
                <div className="flex flex-col justify-between lg:col-span-7">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0b71c7]">
                        <ServiceIcon name={activeService.iconName} />
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-[#0b71c7]">
                        {activeService.category}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                      {activeService.name}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {activeService.fullDescription}
                    </p>

                    {relatedDoctors.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {relatedDoctors.map((d) => (
                          <Link
                            key={d.id}
                            href={`/doctors/${d.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 hover:border-sky-300 hover:text-[#0b71c7]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={d.photoUrl}
                              alt={d.fullName}
                              className="h-4 w-4 rounded-full object-cover object-top"
                            />
                            <span>{d.fullName}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <Link
                      href={`/book?service=${activeService.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0b71c7] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#06213e]"
                    >
                      <span>Book This Service</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/services/${activeService.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-sky-300"
                    >
                      <span>Learn More</span>
                    </Link>
                  </div>
                </div>

                <div className="flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-[#f8fbff] p-4 lg:col-span-5 lg:h-full">
                  {activeService.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeService.imageUrl}
                      alt={activeService.name}
                      className="h-48 w-full object-contain transition duration-500 hover:scale-105"
                    />
                  ) : (
                    <ServiceIcon
                      name={activeService.iconName}
                      className="h-20 w-20 text-sky-400"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Infinite Horizontal Kinetic Marquee Strip */}
      <div className="overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="animate-marquee items-center gap-8">
          {[...services, ...services].map((svc, idx) => (
            <Link
              key={`${svc.id}-${idx}`}
              href={`/services/${svc.slug}`}
              className="flex shrink-0 items-center gap-3 rounded-full border border-slate-100 bg-slate-50/80 px-4 py-1.5 transition hover:border-sky-300 hover:bg-sky-50"
            >
              {svc.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={svc.imageUrl}
                  alt={svc.name}
                  className="h-7 w-7 rounded-full bg-white object-contain p-0.5"
                />
              )}
              <span className="text-sm font-extrabold tracking-tight text-slate-800">
                {svc.name}
              </span>
              <span className="text-sky-500">✦</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
