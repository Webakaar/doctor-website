import Link from "next/link";
import { CalendarClock, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { formatTime12h } from "@/lib/slots";
import { AppointmentStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  const doctorId = user?.doctorId;
  const myAppts = db.appointments.filter((a) => a.doctorId === doctorId);

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const todayAppts = myAppts.filter(
    (a) => a.appointmentDate === todayStr && a.status !== "cancelled"
  );
  const upcomingAppts = myAppts.filter(
    (a) =>
      a.appointmentDate >= todayStr &&
      ["confirmed", "pending_confirmation"].includes(a.status)
  );
  const pendingAppts = myAppts.filter(
    (a) => a.status === "pending_confirmation" || a.status === "pending_payment"
  );
  const recentAppts = myAppts
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Doctor Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Overview of your scheduled consultations and availability.
          </p>
        </div>
        <Link href="/doctor/availability" className="btn-primary">
          <CalendarClock className="h-4 w-4" />
          <span>Manage My Availability</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Today&apos;s Visits</span>
            <CalendarDays className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {todayAppts.length}
          </p>
        </div>
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Upcoming</span>
            <Clock className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {upcomingAppts.length}
          </p>
        </div>
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Pending</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {pendingAppts.length}
          </p>
        </div>
        <div className="card-clinical p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {myAppts.filter((a) => a.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="card-clinical p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Recently Updated Appointments
          </h2>
          <Link
            href="/doctor/appointments"
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="py-2.5 pr-4">Ref</th>
                <th className="py-2.5 pr-4">Patient</th>
                <th className="py-2.5 pr-4">Date &amp; Time</th>
                <th className="py-2.5 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAppts.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-700">
                    {a.bookingRef}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {a.patientName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {a.appointmentDate} • {formatTime12h(a.slotStart)}
                  </td>
                  <td className="py-3 pr-4">
                    <AppointmentStatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
              {recentAppts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No appointments assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
