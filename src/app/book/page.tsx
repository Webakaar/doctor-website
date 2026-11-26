import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import { BookDoctorClient } from "@/components/BookDoctorClient";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams
}: {
  searchParams: Promise<{
    service?: string;
    doctor?: string;
    date?: string;
    slot?: string;
    reason?: string;
  }>;
}) {
  const [db, user, query] = await Promise.all([
    readDb(),
    getCurrentUser(),
    searchParams
  ]);

  const services = db.services
    .filter((s) => s.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const doctors = db.doctors.filter((d) => d.isActive && d.isVisible);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06213e] via-[#083463] to-[#0b4b8a] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200">
            Online Appointment Booking
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Book a Doctor Appointment
          </h1>
          <p className="mt-2 text-sm text-sky-100/85">
            Select your department, preferred specialist, date, and open time slot with instant Razorpay confirmation.
          </p>
        </div>
      </section>

      <section className="bg-[#f4f9ff] pb-16 pt-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <BookDoctorClient
            hospitalName={db.websiteSettings.hospitalName}
            hospitalPhone={db.websiteSettings.phone}
            hospitalEmail={db.websiteSettings.email}
            hospitalAddress={db.websiteSettings.address}
            services={services}
            doctors={doctors}
            bookingRules={db.websiteSettings.bookingSettings}
            currentUser={user}
            initialServiceId={query.service}
            initialDoctorId={query.doctor}
            initialDate={query.date}
            initialSlot={query.slot}
            initialReason={query.reason}
          />
        </div>
      </section>
    </PublicShell>
  );
}
