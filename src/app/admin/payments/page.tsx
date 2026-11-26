import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  AdminPaymentsClient,
  type AdminPaymentRow
} from "@/components/AdminPaymentsClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_payments")) {
    redirect("/admin");
  }

  const payments: AdminPaymentRow[] = db.payments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => {
      const appt = db.appointments.find((a) => a.id === p.appointmentId);
      const doctor = appt
        ? db.doctors.find((d) => d.id === appt.doctorId)
        : undefined;
      return {
        ...p,
        patientName: appt?.patientName || "Unknown",
        doctorName: doctor?.fullName || "Unknown",
        appointmentDate: appt?.appointmentDate || "",
        appointmentStatus: appt?.status || ""
      };
    });

  return <AdminPaymentsClient initialPayments={payments} />;
}
