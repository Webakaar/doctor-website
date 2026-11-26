import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "view_dashboard")) {
    redirect("/admin/appointments");
  }

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const metrics = {
    totalAppointments: db.appointments.length,
    todayAppointments: db.appointments.filter(
      (a) => a.appointmentDate === todayStr && a.status !== "cancelled"
    ).length,
    upcomingAppointments: db.appointments.filter(
      (a) =>
        a.appointmentDate >= todayStr &&
        ["confirmed", "pending_confirmation", "pending_payment"].includes(
          a.status
        )
    ).length,
    pendingAppointments: db.appointments.filter((a) =>
      ["pending_payment", "pending_confirmation"].includes(a.status)
    ).length,
    confirmedAppointments: db.appointments.filter(
      (a) => a.status === "confirmed"
    ).length,
    cancelledAppointments: db.appointments.filter(
      (a) => a.status === "cancelled"
    ).length,
    completedAppointments: db.appointments.filter(
      (a) => a.status === "completed"
    ).length,
    totalRegisteredPatients: db.profiles.filter((p) => p.role === "patient")
      .length,
    activeDoctors: db.doctors.filter((d) => d.isActive).length,
    totalServices: db.services.filter((s) => s.isPublished).length,
    totalRevenue: db.payments
      .filter((p) => p.status === "captured")
      .reduce((s, p) => s + p.amount, 0),
    totalRefunded: db.payments
      .filter((p) => p.status === "refunded")
      .reduce((s, p) => s + p.amount, 0),
    openEnquiries: db.enquiries.filter((e) => e.status === "new").length
  };

  const recentBookings = db.appointments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((appt) => ({
      ...appt,
      doctorName:
        db.doctors.find((d) => d.id === appt.doctorId)?.fullName || "Unknown",
      serviceName:
        db.services.find((s) => s.id === appt.serviceId)?.name || "General"
    }));

  return (
    <AdminDashboardClient
      initialMetrics={metrics}
      initialRecentBookings={recentBookings}
    />
  );
}
