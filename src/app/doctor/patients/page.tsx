import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { formatTime12h } from "@/lib/slots";
import { AppointmentStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DoctorPatientsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);

  const assigned = db.appointments
    .filter((a) => a.doctorId === user?.doctorId)
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Patient Details
        </h1>
        <p className="text-sm text-slate-600">
          Scoped strictly to patients booked for your consultations. Unrelated hospital records are hidden.
        </p>
      </div>

      <div className="card-clinical overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking Ref</th>
                <th className="px-4 py-3">Patient &amp; Contact</th>
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">Service / Reason</th>
                <th className="px-4 py-3">Notes &amp; Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assigned.map((a) => {
                const svc = db.services.find((s) => s.id === a.serviceId);
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">
                      {a.bookingRef}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{a.patientName}</p>
                      <p className="text-xs text-slate-600">{a.patientPhone}</p>
                      <p className="text-xs text-slate-500">{a.patientEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      <p className="font-semibold">{a.appointmentDate}</p>
                      <p>{formatTime12h(a.slotStart)}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-700">
                      <p className="font-semibold text-brand-700">
                        {svc?.name || "Consultation"}
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {a.reasonForVisit || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentStatusBadge status={a.status} />
                      {a.notes && (
                        <p className="mt-1.5 text-xs text-slate-500">
                          {a.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {assigned.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No patient bookings assigned yet.
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
