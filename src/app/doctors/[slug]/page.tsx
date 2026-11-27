import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import {
  formatTime12h,
  generateDoctorQueueWindowsForDate
} from "@/lib/slots";
import { DoctorSlotExplorerClient } from "@/components/DoctorSlotExplorerClient";
import { ScrollReveal } from "@/components/MotionPrimitives";
import { ServiceIcon } from "@/components/ServiceIcon";

export const dynamic = "force-dynamic";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export default async function DoctorProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await readDb();
  const doctor = db.doctors.find(
    (d) => d.slug === slug && d.isActive && d.isVisible
  );
  if (!doctor) notFound();

  const docServices = db.services.filter(
    (s) => s.isPublished && doctor.serviceIds.includes(s.id)
  );
  const schedules = db.doctorSchedules
    .filter((s) => s.doctorId === doctor.id)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const now = new Date();
  const todayDow = now.getDay();
  const availableToday = Boolean(
    schedules.find((s) => s.dayOfWeek === todayDow)?.isAvailable
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0")
  ].join("-");

  const tomorrowWindows = generateDoctorQueueWindowsForDate({
    doctorId: doctor.id,
    dateStr: tomorrowStr,
    schedules: db.doctorSchedules,
    blockedSlots: db.blockedSlots,
    appointments: db.appointments,
    queueStates: db.queueStates,
    bookingRules: db.websiteSettings.bookingSettings
  });

  return (
    <PublicShell>
      {/* Editorial Deep Navy Doctor Profile Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] pb-16 pt-8 text-white">
        {/* Giant Subtle Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-6 select-none text-[12rem] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        >
          DOCTOR
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-sky-100 backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Specialists</span>
          </Link>

          <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
            {/* Tall Studio Portrait */}
            <div className="min-w-0 lg:col-span-3">
              <div className="animate-fade-slide mx-auto h-64 w-56 overflow-hidden rounded-3xl border-4 border-white/20 bg-[#eef6fc] pt-2 shadow-2xl lg:w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doctor.photoUrl}
                  alt={doctor.fullName}
                  className={`h-full w-full object-contain object-bottom ${
                    doctor.photoUrl.includes("hero-doctor")
                      ? "mix-blend-multiply"
                      : ""
                  }`}
                />
              </div>
            </div>

            {/* Doctor Info & Badges */}
            <div className="animate-fade-slide min-w-0 space-y-4 lg:col-span-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3.5 py-1 text-xs font-bold text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{doctor.specialty}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    availableToday
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      availableToday
                        ? "animate-pulse bg-emerald-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {availableToday ? "Available Today" : "OPD By Schedule"}
                  </span>
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {doctor.fullName}
              </h1>

              <p className="flex items-start gap-2 text-sm text-sky-100/90">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <span>{doctor.qualification}</span>
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <p className="text-lg font-extrabold text-white">
                    {doctor.experienceYears}+ yrs
                  </p>
                  <p className="text-[11px] text-sky-200">Experience</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <p className="text-lg font-extrabold text-white">
                    Live Queue
                  </p>
                  <p className="text-[11px] text-sky-200">OPD Windows</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <p className="text-lg font-extrabold text-white">4.9 ★</p>
                  <p className="text-[11px] text-sky-200">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* Glassmorphic Quick Fee & Booking Card */}
            <div className="min-w-0 lg:col-span-4">
              <div className="rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Consultation Fee
                    </p>
                    <p className="mt-0.5 text-3xl font-black text-slate-900">
                      ₹{doctor.consultationFee}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0b71c7]">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Zero double-booking slot lock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Instant Email, SMS &amp; WhatsApp receipt</span>
                  </li>
                </ul>

                <a
                  href="#book-slot"
                  className="group mt-5 inline-flex w-full items-center justify-between rounded-full bg-[#0b71c7] py-2.5 pl-5 pr-2.5 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition hover:bg-[#06213e]"
                >
                  <span>Book Appointment</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0b71c7] transition-transform duration-300 group-hover:translate-y-0.5">
                    <ArrowDown className="h-4 w-4" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editorial 2-Column Details */}
      <section className="overflow-x-clip bg-[#f4f9ff] py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            {/* Biography + Clinical Highlights */}
            <ScrollReveal>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  About Specialist
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  Professional Biography &amp; Clinical Focus
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {doctor.biography}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      icon: Award,
                      title: "Verified Specialist",
                      desc: "Board-certified hospital consultant"
                    },
                    {
                      icon: ShieldCheck,
                      title: "Transparent Care",
                      desc: "Clear diagnostic & treatment plan"
                    },
                    {
                      icon: BellRing,
                      title: "Instant Updates",
                      desc: "Automated SMS & WhatsApp alerts"
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                      >
                        <Icon className="h-5 w-5 text-[#0b71c7]" />
                        <p className="mt-2 text-xs font-extrabold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {docServices.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Associated Clinical Departments
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {docServices.map((svc) => (
                        <Link
                          key={svc.id}
                          href={`/services/${svc.slug}`}
                          className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:border-sky-300 hover:bg-sky-50/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0b71c7]">
                              <ServiceIcon
                                name={svc.iconName}
                                className="h-5 w-5"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">
                                {svc.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {svc.category}
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#0b71c7]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Interactive 7-Day Live Slot Explorer */}
            <div id="book-slot" className="scroll-mt-24">
              <ScrollReveal delayMs={80}>
                <DoctorSlotExplorerClient
                  doctorId={doctor.id}
                  initialDate={tomorrowStr}
                  initialWindows={tomorrowWindows}
                />
              </ScrollReveal>
            </div>
          </div>

          {/* Sticky Right Sidebar */}
          <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0b71c7]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Weekly OPD Schedule
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    In-person consultation hours
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-xs">
                {schedules.map((s) => {
                  const isToday = s.dayOfWeek === todayDow;
                  return (
                    <li
                      key={s.id}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${
                        isToday
                          ? "border border-sky-200 bg-[#eef6ff]"
                          : "bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {DAY_NAMES[s.dayOfWeek]}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-[#0b71c7] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                            Today
                          </span>
                        )}
                      </div>
                      {s.isAvailable ? (
                        <span className="font-semibold text-emerald-700">
                          {formatTime12h(s.startTime)} –{" "}
                          {formatTime12h(s.endTime)}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-400">
                          Closed
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#06213e] to-[#0b4b8a] p-6 text-white shadow-lg">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                Patient Protection
              </span>
              <h3 className="mt-3 text-lg font-extrabold">
                Book With Confidence
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-sky-100/85">
                Every online booking holds your selected slot during Razorpay checkout and allows hassle-free cancellation up to{" "}
                {db.websiteSettings.bookingSettings.cancellationWindowHours}{" "}
                hours before your visit.
              </p>
              <Link
                href={`/book?doctor=${doctor.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#06213e] transition hover:bg-sky-50"
              >
                <span>Reserve Consultation</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
