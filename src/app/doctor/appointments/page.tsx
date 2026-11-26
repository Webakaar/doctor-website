import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  DoctorAppointmentsClient,
  type DoctorAppointmentItem
} from "@/components/DoctorAppointmentsClient";

export const dynamic = "force-dynamic";

export default async function DoctorAppointmentsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);

  const myAppts: DoctorAppointmentItem[] = db.appointments
    .filter((a) => a.doctorId === user?.doctorId)
    .map((a) => ({
      ...a,
      serviceName:
        db.services.find((s) => s.id === a.serviceId)?.name || "Consultation"
    }))
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  return <DoctorAppointmentsClient initialAppointments={myAppts} />;
}
