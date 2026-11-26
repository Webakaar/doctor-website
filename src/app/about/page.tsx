import type { Metadata } from "next";
import Link from "next/link";
import { Award, Building2, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { ServiceIcon } from "@/components/ServiceIcon";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const db = await readDb();
  return {
    title: db.websiteSettings.seoSettings.aboutTitle || `About | ${db.websiteSettings.hospitalName}`
  };
}

export default async function AboutPage() {
  const db = await readDb();
  const s = db.websiteSettings;

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] py-16 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-4 select-none text-[10rem] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        >
          AURACARE
        </div>
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-sky-200">
            <Building2 className="h-3.5 w-3.5" />
            About {s.hospitalName}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Clinical Excellence Guided by Compassion
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-sky-100/85 sm:text-base">
            {s.aboutIntro}
          </p>
        </div>
      </section>

      <section className="bg-[#f4f9ff] py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="card-clinical p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Our Mission</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {s.aboutMission}
            </p>
          </div>

          <div className="card-clinical p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Our Vision</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {s.aboutVision}
            </p>
          </div>

          <div className="card-clinical p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Healthcare Philosophy
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {s.aboutPhilosophy}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="card-clinical p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Facilities &amp; Infrastructure
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {s.aboutFacilities}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {s.facilitiesHighlights.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                >
                  <p className="text-xs font-bold text-brand-700">{f.badge}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {f.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-clinical p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Accreditations &amp; Quality Standards
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Verified standards and protocols maintained across our clinical departments:
            </p>
            <ul className="mt-5 space-y-3">
              {s.certifications.map((cert) => (
                <li
                  key={cert}
                  className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  <Award className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/doctors" className="btn-secondary">
                Meet Our Doctors
              </Link>
              <Link href="/book" className="btn-primary">
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Reasons to Choose {s.hospitalName}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {s.whyChooseUs.map((item) => (
              <div key={item.title} className="card-clinical p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <ServiceIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
