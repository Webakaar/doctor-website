import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  AdminPatientsClient,
  type AdminPatientRow
} from "@/components/AdminPatientsClient";

export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_patients")) {
    redirect("/admin");
  }

  const patients: AdminPatientRow[] = db.profiles
    .filter((p) => p.role === "patient")
    .map((p) => ({
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      isActive: p.isActive,
      createdAt: p.createdAt,
      appointments: db.appointments
        .filter(
          (a) =>
            a.patientId === p.id ||
            a.patientEmail.toLowerCase() === p.email.toLowerCase()
        )
        .map((a) => ({
          id: a.id,
          bookingRef: a.bookingRef,
          doctorName:
            db.doctors.find((d) => d.id === a.doctorId)?.fullName || "Unknown",
          serviceName:
            db.services.find((s) => s.id === a.serviceId)?.name || "General",
          appointmentDate: a.appointmentDate,
          slotStart: a.slotStart,
          status: a.status,
          paymentStatus: a.paymentStatus
        }))
    }));

  return <AdminPatientsClient initialPatients={patients} />;
}
