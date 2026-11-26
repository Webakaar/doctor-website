import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminSettingsClient } from "@/components/AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_website")) {
    redirect("/admin");
  }

  const staff =
    user?.role === "super_admin"
      ? db.profiles
          .filter((p) => p.role === "staff" || p.role === "super_admin")
          .map(({ passwordHash: _ignored, ...rest }) => {
            void _ignored;
            return rest;
          })
      : [];

  return (
    <AdminSettingsClient
      initialSettings={db.websiteSettings}
      initialEnquiries={db.enquiries}
      initialStaff={staff}
      isSuperAdmin={user?.role === "super_admin"}
    />
  );
}
