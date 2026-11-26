import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  AdminAppointmentsClient,
  type AdminAppointmentRow
} from "@/components/AdminAppointmentsClient";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_appointments")) {
    redirect("/admin");
  }

  const rows: AdminAppointmentRow[] = db.appointments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((appt) => ({
      ...appt,
      doctorName:
        db.doctors.find((d) => d.id === appt.doctorId)?.fullName || "Unknown",
      serviceName:
        db.services.find((s) => s.id === appt.serviceId)?.name || "General",
      payment: db.payments.find((p) => p.appointmentId === appt.id),
      history: db.appointmentStatusHistory.filter(
        (h) => h.appointmentId === appt.id
      ),
      notifications: db.notificationLogs.filter(
        (n) => n.appointmentId === appt.id
      )
    }));

  return (
    <AdminAppointmentsClient
      initialAppointments={rows}
      doctors={db.doctors}
      services={db.services}
    />
  );
}
