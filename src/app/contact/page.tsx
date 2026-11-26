import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone, Siren } from "lucide-react";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { ContactFormClient } from "@/components/ContactFormClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const db = await readDb();
  return {
    title:
      db.websiteSettings.seoSettings.contactTitle ||
      `Contact Us | ${db.websiteSettings.hospitalName}`
  };
}

export default async function ContactPage() {
  const db = await readDb();
  const s = db.websiteSettings;

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-4 select-none text-[10rem] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        >
          CONTACT
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200">
            Reach Our Hospital
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Contact Us &amp; Directions
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-sky-100/85 sm:text-base">
            Connect with {s.hospitalName} for appointments, department guidance, or general enquiries.
          </p>
        </div>
      </section>

      <section className="bg-[#f4f9ff] py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="space-y-5 lg:col-span-5">
            <div className="card-clinical space-y-5 p-6">
              <div className="flex items-start gap-3.5">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Hospital Address
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{s.address}</p>
                  {s.mapLink && (
                    <a
                      href={s.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      <span>Open Directions on Map</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3.5 border-t border-slate-100 pt-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Appointment &amp; Reception Desk
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">{s.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 border-t border-slate-100 pt-4">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Email</h2>
                  <p className="mt-1 text-sm text-slate-700">{s.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 border-t border-slate-100 pt-4">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Working Hours
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{s.workingHours}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-center gap-2.5 text-rose-800">
                <Siren className="h-5 w-5" />
                <h2 className="text-sm font-bold">24×7 Emergency Helpline</h2>
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-rose-900">
                {s.emergencyPhone}
              </p>
              <p className="mt-1 text-xs text-rose-700">
                For urgent medical emergencies, call our emergency desk or visit Casualty directly.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactFormClient />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
