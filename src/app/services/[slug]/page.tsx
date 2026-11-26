import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from "lucide-react";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { ServiceIcon } from "@/components/ServiceIcon";
import { getServiceSeoContent } from "@/lib/service-seo-content";
import { ServiceFaqClient } from "@/components/ServiceFaqClient";
import { ScrollReveal } from "@/components/MotionPrimitives";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = await readDb();
    const service = db.services.find(
      (s) => s.slug === slug && s.isPublished
    );
    if (!service) return {};
    const seo = getServiceSeoContent(service);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return {
      title: seo.seoTitle,
      description: seo.seoDescription,
      keywords: seo.keywords,
      alternates: {
        canonical: `${baseUrl}/services/${service.slug}`
      },
      openGraph: {
        title: seo.seoTitle,
        description: seo.seoDescription,
        type: "website",
        url: `${baseUrl}/services/${service.slug}`,
        images: service.imageUrl ? [{ url: `${baseUrl}${service.imageUrl}` }] : undefined
      }
    };
  } catch {
    return {};
  }
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await readDb();
  const service = db.services.find(
    (s) => s.slug === slug && s.isPublished
  );
  if (!service) notFound();

  const relatedDoctors = db.doctors.filter(
    (d) => d.isActive && d.isVisible && d.serviceIds.includes(service.id)
  );

  const content = getServiceSeoContent(service);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        name: content.seoTitle,
        description: content.seoDescription,
        url: `${baseUrl}/services/${service.slug}`,
        about: {
          "@type": "MedicalSpecialty",
          name: service.name
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: `${baseUrl}/services`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.name,
            item: `${baseUrl}/services/${service.slug}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer
          }
        }))
      }
    ]
  };

  return (
    <PublicShell>
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Editorial Deep Navy Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-4 select-none text-[10rem] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        >
          {service.category.split(" ")[0]}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Visible SEO Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-sky-200/85"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-white">
              Services
            </Link>
            <span>/</span>
            <span className="font-bold text-white">{service.name}</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
            <div className="min-w-0 space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-sky-200 backdrop-blur">
                  <ServiceIcon name={service.iconName} className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3.5 py-1 text-xs font-bold text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{content.heroBadge}</span>
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                {service.name}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
                {service.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/book?service=${service.id}`}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-bold text-[#06213e] shadow-lg transition hover:bg-sky-50"
                >
                  <CalendarCheck className="h-4 w-4 text-[#0b71c7]" />
                  <span>Book Department Specialist</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b71c7] text-white transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>All Departments</span>
                </Link>
              </div>
            </div>

            {service.imageUrl && (
              <div className="min-w-0 lg:col-span-4">
                <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.imageUrl}
                    alt={`${service.name} clinical care`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content + Specialists Sidebar */}
      <section className="overflow-x-clip bg-[#f4f9ff] py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Left Rich SEO & Clinical Content Column */}
          <div className="min-w-0 space-y-8 lg:col-span-8">
            {/* 1. Comprehensive Overview */}
            <ScrollReveal>
              <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  Department Overview
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  Comprehensive {service.name} at{" "}
                  {db.websiteSettings.hospitalName}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {content.overviewParagraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </article>
            </ScrollReveal>

            {/* 2. Conditions Treated */}
            <ScrollReveal>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>Conditions We Treat</span>
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  Key Conditions &amp; Medical Concerns Managed
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {content.conditionsTreated.map((cond) => (
                    <div
                      key={cond}
                      className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-800 sm:text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b71c7]" />
                      <span>{cond}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* 3. Diagnostic & Treatment Procedures */}
            <ScrollReveal>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Diagnostics &amp; Procedures</span>
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  Clinical Evaluations &amp; Diagnostic Services
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {content.procedures.map((proc) => (
                    <div
                      key={proc.name}
                      className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/40 p-5"
                    >
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {proc.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {proc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* 4. Symptoms Checklist & Visit Preparation */}
            <ScrollReveal>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-amber-200/70 bg-[#fffdf5] p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h2 className="text-lg font-extrabold">
                      When to See a Specialist
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {content.whenToVisitSymptoms.map((sym) => (
                      <li key={sym} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-sky-200/70 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-[#06213e]">
                    <ClipboardCheck className="h-5 w-5 text-[#0b71c7]" />
                    <h2 className="text-lg font-extrabold">
                      Before Your Consultation
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {content.preparationChecklist.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* 5. 4-Step Patient Journey */}
            <ScrollReveal>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  Consultation Workflow
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  What to Expect During Your Visit
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {content.consultationSteps.map((s) => (
                    <div
                      key={s.step}
                      className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b71c7] font-mono text-xs font-extrabold text-white">
                        {s.step}
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {s.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* 6. Department-Specific SEO FAQs */}
            <ScrollReveal>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                  Frequently Asked Questions
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  {service.name} — Patient FAQs
                </h2>
                <div className="mt-5">
                  <ServiceFaqClient faqs={content.faqs} />
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Sticky Sidebar: Specialists, Assurance & Cross-Links */}
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Specialists in {service.name}
              </h2>
              {relatedDoctors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  No doctors are currently assigned to this service.
                </div>
              ) : (
                relatedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-sky-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-sky-100 bg-[#eef6fc] pt-1">
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
                      <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-900">
                          {doc.fullName}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#0b71c7]">
                          {doc.specialty}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {doc.experienceYears}+ yrs exp • ₹{doc.consultationFee}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/doctors/${doc.slug}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-sky-300"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/book?service=${service.id}&doctor=${doc.id}`}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-[#0b71c7] px-3 py-2 text-xs font-bold text-white hover:bg-[#06213e]"
                      >
                        <span>Book Slot</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Booking Assurance Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#06213e] to-[#0b4b8a] p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 text-sky-300">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Verified Online Booking
                </span>
              </div>
              <h3 className="mt-2 text-lg font-extrabold">
                Book {service.name} Online
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-sky-100/85">
                View real-time doctor slots, lock your consultation time securely via Razorpay, and receive instant confirmation on Email, SMS, and WhatsApp.
              </p>
              <Link
                href={`/book?service=${service.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#06213e] transition hover:bg-sky-50"
              >
                <span>Schedule Appointment</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
