import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PublicShell } from "@/components/PublicShell";
import {
  PatientDashboardClient,
  type EnrichedPatientAppointment
} from "@/components/PatientDashboardClient";

export const dynamic = "force-dynamic";

export default async function PatientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "super_admin" || user.role === "staff") redirect("/admin");
  if (user.role === "doctor") redirect("/doctor");

  const db = await readDb();
  const appointments: EnrichedPatientAppointment[] = db.appointments
    .filter(
      (a) =>
        a.patientId === user.id ||
        a.patientEmail.toLowerCase() === user.email.toLowerCase()
    )
    .map((a) => {
      const doctor = db.doctors.find((d) => d.id === a.doctorId);
      const service = db.services.find((s) => s.id === a.serviceId);
      const payment = db.payments.find((p) => p.appointmentId === a.id);
      return {
        ...a,
        doctorName: doctor?.fullName || "Unknown Doctor",
        doctorSpecialty: doctor?.specialty || "",
        serviceName: service?.name || "General Consultation",
        payment
      };
    })
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  return (
    <PublicShell>
      <PatientDashboardClient
        user={user}
        initialAppointments={appointments}
        bookingRules={db.websiteSettings.bookingSettings}
        hospitalName={db.websiteSettings.hospitalName}
        hospitalPhone={db.websiteSettings.phone}
        hospitalEmail={db.websiteSettings.email}
        hospitalAddress={db.websiteSettings.address}
      />
    </PublicShell>
  );
}
