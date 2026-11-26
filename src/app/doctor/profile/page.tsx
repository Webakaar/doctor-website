import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { DoctorProfileClient } from "@/components/DoctorProfileClient";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  const doctor = db.doctors.find((d) => d.id === user?.doctorId);

  if (!doctor) {
    return (
      <div className="card-clinical p-6 text-sm text-slate-600">
        Doctor profile not found.
      </div>
    );
  }

  const services = db.services.filter((s) => doctor.serviceIds.includes(s.id));
  return <DoctorProfileClient doctor={doctor} services={services} />;
}
