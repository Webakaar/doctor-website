import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutPillarsSection } from "@/components/home/AboutPillarsSection";
import { InteractiveServicesSection } from "@/components/home/InteractiveServicesSection";
import {
  DoctorsCarouselClient,
  type HomeDoctorCardItem
} from "@/components/DoctorsCarouselClient";
import { InteractiveShowcases } from "@/components/home/InteractiveShowcases";
import { ScrollReveal } from "@/components/MotionPrimitives";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await readDb();
  const settings = db.websiteSettings;
  const publishedServices = db.services
    .filter((s) => s.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const activeDoctors = db.doctors.filter((d) => d.isActive && d.isVisible);
  const approvedTestimonials = settings.testimonials.filter((t) => t.approved);
  const todayDow = new Date().getDay();

  const doctorCards: HomeDoctorCardItem[] = activeDoctors.map((doc) => ({
    ...doc,
    availableToday: Boolean(
      db.doctorSchedules.find(
        (s) => s.doctorId === doc.id && s.dayOfWeek === todayDow
      )?.isAvailable
    )
  }));

  const insights = [
    {
      tag: "Cardiology",
      title: "Why Preventive Heart Screening Matters After Age 35",
      img: "/images/services/cardiology.jpg",
      href: "/services/cardiology"
    },
    {
      tag: "Pediatrics",
      title: "Essential Childhood Immunisation & Milestone Checklist",
      img: "/images/services/pediatrics.jpg",
      href: "/services/pediatrics"
    },
    {
      tag: "Orthopedics",
      title: "Joint Protection & Mobility Habits for Active Adults",
      img: "/images/services/orthopedics.jpg",
      href: "/services/orthopedics"
    }
  ];

  return (
    <PublicShell>
      {/* 1. Kinetic Hero + 3-Doctor Layered Composition + 3-Tile Quick Dock */}
      <HeroSection
        heroSubtitle={settings.heroSubtitle}
        emergencyPhone={settings.emergencyPhone}
        services={publishedServices}
        doctors={activeDoctors}
      />

      {/* 2. Editorial About & Interactive 3-Pillar Timeline */}
      <AboutPillarsSection
        hospitalName={settings.hospitalName}
        aboutIntro={settings.aboutIntro}
      />

      {/* 3. Deep Navy Tabbed Services Showcase + Infinite Kinetic Marquee */}
      <InteractiveServicesSection
        services={publishedServices}
        doctors={activeDoctors}
      />

      {/* 4. Interactive Doctor Cards Carousel Band */}
      <section className="bg-[#eaf4fc] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DoctorsCarouselClient doctors={doctorCards} />
        </div>
      </section>

      {/* 5. Spotlight, Animated Stats, FAQ, 98% Collage, Team Banner & 4-Step Timeline */}
      <InteractiveShowcases
        doctors={activeDoctors}
        testimonials={approvedTestimonials}
        activeDoctorsCount={activeDoctors.length}
        servicesCount={publishedServices.length}
      />

      {/* 6. Stay Informed Clinical Highlights */}
      <section className="bg-[#f3f8fe] pb-4 pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b71c7] shadow-sm">
                Clinical Guides
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Stay Informed With{" "}
                <span className="text-[#0b71c7]">Specialist Guides</span>
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-[#06213e] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#0b71c7]"
            >
              <span>Explore Departments</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {insights.map((item, idx) => (
              <ScrollReveal key={item.title} delayMs={idx * 80}>
                <Link
                  href={item.href}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-[#f8fbff] p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b71c7]">
                      {item.tag}
                    </span>
                    <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-[#0b71c7]">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
