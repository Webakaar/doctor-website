import type { Metadata } from "next";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { ServicesCatalogClient } from "@/components/ServicesCatalogClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const db = await readDb();
  return {
    title:
      db.websiteSettings.seoSettings.servicesTitle ||
      `Medical Services | ${db.websiteSettings.hospitalName}`
  };
}

export default async function ServicesPage() {
  const db = await readDb();
  const services = db.services
    .filter((s) => s.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const doctors = db.doctors.filter((d) => d.isActive && d.isVisible);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-4 select-none text-[10rem] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        >
          SERVICES
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200">
            Hospital Departments
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Medical Services &amp; Specialities
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-sky-100/85 sm:text-base">
            Explore our published clinical departments, learn about treatments, and book directly with an associated specialist.
          </p>
        </div>
      </section>

      <section className="bg-[#f4f9ff] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ServicesCatalogClient services={services} doctors={doctors} />
        </div>
      </section>
    </PublicShell>
  );
}
