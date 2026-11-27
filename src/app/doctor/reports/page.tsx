import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  DoctorReportsClient,
  type DoctorReportAppointment
} from "@/components/DoctorReportsClient";

export const dynamic = "force-dynamic";

export default async function DoctorReportsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!user || user.role !== "doctor") {
    redirect("/login");
  }

  const doctor = db.doctors.find((d) => d.id === user.doctorId);
  const appointments: DoctorReportAppointment[] = db.appointments
    .filter((a) => a.doctorId === user.doctorId)
    .map((a) => ({
      ...a,
      serviceName:
        db.services.find((s) => s.id === a.serviceId)?.name || "Consultation"
    }))
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  return (
    <DoctorReportsClient
      doctorName={doctor?.fullName || user.fullName}
      appointments={appointments}
    />
  );
}
