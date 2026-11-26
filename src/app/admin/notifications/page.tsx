import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminNotificationsClient } from "@/components/AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!hasAdminPermission(user, "manage_notifications")) {
    redirect("/admin");
  }

  return (
    <AdminNotificationsClient
      initialConfig={db.websiteSettings.notificationSettings}
      initialLogs={db.notificationLogs.slice(0, 60)}
    />
  );
}
