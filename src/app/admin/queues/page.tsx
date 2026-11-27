import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  generateDoctorQueueWindowsForDate,
  inferSessionFromAppointment
} from "@/lib/slots";
import { AdminQueuesClient } from "@/components/AdminQueuesClient";

export const dynamic = "force-dynamic";

export default async function AdminQueuesPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (
    !hasAdminPermission(user, "manage_queue") &&
    !hasAdminPermission(user, "manage_doctors") &&
    !hasAdminPermission(user, "view_dashboard")
  ) {
    redirect("/admin");
  }

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const rules = db.websiteSettings.bookingSettings;

  const dailyQueues = db.doctors
    .filter((d) => d.isActive)
    .map((doc) => ({
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialty,
      windows: generateDoctorQueueWindowsForDate({
        doctorId: doc.id,
        dateStr: todayStr,
        schedules: db.doctorSchedules,
        blockedSlots: db.blockedSlots,
        appointments: db.appointments,
        queueStates: db.queueStates,
        bookingRules: rules
      })
    }));

  const doctorReports = db.doctors.map((doc) => {
    const docAppts = db.appointments.filter((a) => a.doctorId === doc.id);
    return {
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialty,
      totalBookings: docAppts.length,
      activeCount: docAppts.filter((a) => a.status !== "cancelled").length,
      morningCount: docAppts.filter(
        (a) =>
          a.status !== "cancelled" &&
          inferSessionFromAppointment(a) === "morning"
      ).length,
      eveningCount: docAppts.filter(
        (a) =>
          a.status !== "cancelled" &&
          inferSessionFromAppointment(a) === "evening"
      ).length,
      completedCount: docAppts.filter((a) => a.status === "completed").length,
      noShowCount: docAppts.filter((a) => a.status === "no_show").length,
      cancelledCount: docAppts.filter((a) => a.status === "cancelled").length,
      revenue: docAppts
        .filter((a) => a.paymentStatus === "paid")
        .reduce((sum, a) => sum + a.consultationFee, 0),
      discounts: docAppts
        .filter((a) => a.status !== "cancelled")
        .reduce((sum, a) => sum + (a.discountAmount || 0), 0)
    };
  });

  return (
    <AdminQueuesClient
      initialDate={todayStr}
      initialRules={{
        queueMinutesPerPatient: rules.queueMinutesPerPatient ?? 15,
        queueBufferMinutes: rules.queueBufferMinutes ?? 15
      }}
      initialDailyQueues={dailyQueues}
      initialReports={doctorReports}
    />
  );
}
