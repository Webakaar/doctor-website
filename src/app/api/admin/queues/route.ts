import { NextResponse } from "next/server";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  generateDoctorQueueWindowsForDate,
  inferSessionFromAppointment
} from "@/lib/slots";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (
    !hasAdminPermission(user, "view_dashboard") &&
    !hasAdminPermission(user, "manage_doctors") &&
    !hasAdminPermission(user, "manage_queue") &&
    !hasAdminPermission(user, "manage_appointments")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const targetDate = searchParams.get("date") || todayStr;
  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  const db = await readDb();
  const rules = db.websiteSettings.bookingSettings;

  const dailyQueues = db.doctors
    .filter((d) => d.isActive)
    .map((doc) => ({
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialty,
      windows: generateDoctorQueueWindowsForDate({
        doctorId: doc.id,
        dateStr: targetDate,
        schedules: db.doctorSchedules,
        blockedSlots: db.blockedSlots,
        appointments: db.appointments,
        queueStates: db.queueStates,
        bookingRules: rules
      })
    }));

  const rangeAppts = db.appointments.filter((a) => {
    if (fromDate && a.appointmentDate < fromDate) return false;
    if (toDate && a.appointmentDate > toDate) return false;
    return true;
  });

  const doctorReports = db.doctors.map((doc) => {
    const docAppts = rangeAppts.filter((a) => a.doctorId === doc.id);
    const activeCount = docAppts.filter((a) => a.status !== "cancelled").length;
    const morningCount = docAppts.filter(
      (a) =>
        a.status !== "cancelled" &&
        inferSessionFromAppointment(a) === "morning"
    ).length;
    const eveningCount = docAppts.filter(
      (a) =>
        a.status !== "cancelled" &&
        inferSessionFromAppointment(a) === "evening"
    ).length;
    const completedCount = docAppts.filter(
      (a) => a.status === "completed"
    ).length;
    const noShowCount = docAppts.filter((a) => a.status === "no_show").length;
    const cancelledCount = docAppts.filter(
      (a) => a.status === "cancelled"
    ).length;
    const revenue = docAppts
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + a.consultationFee, 0);
    const discounts = docAppts
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + (a.discountAmount || 0), 0);

    return {
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialty,
      totalBookings: docAppts.length,
      activeCount,
      morningCount,
      eveningCount,
      completedCount,
      noShowCount,
      cancelledCount,
      revenue,
      discounts
    };
  });

  return NextResponse.json({
    date: targetDate,
    rules: {
      queueMinutesPerPatient: rules.queueMinutesPerPatient ?? 15,
      queueBufferMinutes: rules.queueBufferMinutes ?? 15
    },
    dailyQueues,
    doctorReports
  });
}
