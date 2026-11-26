import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { DoctorAvailabilityClient } from "@/components/DoctorAvailabilityClient";

export const dynamic = "force-dynamic";

export default async function DoctorAvailabilityPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  const doctor = db.doctors.find((d) => d.id === user?.doctorId);

  if (!doctor) {
    return (
      <div className="card-clinical p-6 text-sm text-slate-600">
        No linked doctor profile found for this account.
      </div>
    );
  }

  const schedules = db.doctorSchedules.filter((s) => s.doctorId === doctor.id);
  const blocks = db.blockedSlots.filter((b) => b.doctorId === doctor.id);

  return (
    <DoctorAvailabilityClient
      doctorId={doctor.id}
      doctorName={doctor.fullName}
      initialSchedules={schedules}
      initialBlocks={blocks}
    />
  );
}
