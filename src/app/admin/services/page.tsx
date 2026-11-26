import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminServicesClient } from "@/components/AdminServicesClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_services")) {
    redirect("/admin");
  }

  const services = db.services
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((svc) => ({
      ...svc,
      doctorIds: db.doctors
        .filter((d) => d.serviceIds.includes(svc.id))
        .map((d) => d.id)
    }));

  return (
    <AdminServicesClient initialServices={services} doctors={db.doctors} />
  );
}
