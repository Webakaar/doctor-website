import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminDoctorsClient } from "@/components/AdminDoctorsClient";

export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_doctors")) {
    redirect("/admin");
  }

  const doctors = db.doctors.map((d) => ({
    ...d,
    accountEmail:
      db.profiles.find((p) => p.id === d.profileId)?.email || null
  }));

  return (
    <AdminDoctorsClient
      initialDoctors={doctors}
      services={db.services}
      schedules={db.doctorSchedules}
      blockedSlots={db.blockedSlots}
    />
  );
}
