import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "view_dashboard")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const db = await readDb();
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const filteredAppointments = db.appointments.filter((a) => {
    if (fromDate && a.appointmentDate < fromDate) return false;
    if (toDate && a.appointmentDate > toDate) return false;
    return true;
  });

  const filteredIds = new Set(filteredAppointments.map((a) => a.id));
  const filteredPayments = db.payments.filter((p) =>
    filteredIds.has(p.appointmentId)
  );

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = filteredPayments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0);

  const recentBookings = filteredAppointments
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

  return NextResponse.json({
    metrics: {
      totalAppointments: filteredAppointments.length,
      todayAppointments: filteredAppointments.filter(
        (a) => a.appointmentDate === todayStr && a.status !== "cancelled"
      ).length,
      upcomingAppointments: filteredAppointments.filter(
        (a) =>
          a.appointmentDate >= todayStr &&
          ["confirmed", "pending_confirmation", "pending_payment"].includes(
            a.status
          )
      ).length,
      pendingAppointments: filteredAppointments.filter((a) =>
        ["pending_payment", "pending_confirmation"].includes(a.status)
      ).length,
      confirmedAppointments: filteredAppointments.filter(
        (a) => a.status === "confirmed"
      ).length,
      cancelledAppointments: filteredAppointments.filter(
        (a) => a.status === "cancelled"
      ).length,
      completedAppointments: filteredAppointments.filter(
        (a) => a.status === "completed"
      ).length,
      totalRegisteredPatients: db.profiles.filter((p) => p.role === "patient")
        .length,
      activeDoctors: db.doctors.filter((d) => d.isActive).length,
      totalServices: db.services.filter((s) => s.isPublished).length,
      totalRevenue,
      totalRefunded,
      openEnquiries: db.enquiries.filter((e) => e.status === "new").length
    },
    recentBookings
  });
}
