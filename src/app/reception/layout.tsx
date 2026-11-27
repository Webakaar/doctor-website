import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PanelShell, type PanelNavItem } from "@/components/PanelShell";

export const dynamic = "force-dynamic";

export default async function ReceptionPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  const allowed =
    user &&
    (user.role === "reception" ||
      user.role === "super_admin" ||
      hasAdminPermission(user, "manage_queue") ||
      hasAdminPermission(user, "manage_appointments"));

  if (!allowed) {
    redirect("/login");
  }

  const navItems: PanelNavItem[] = [
    { href: "/reception", label: "Live OPD Queue Desk", icon: "queue" }
  ];

  if (user.role === "super_admin" || user.role === "staff") {
    navItems.push({
      href: "/admin",
      label: "Admin Dashboard",
      icon: "dashboard"
    });
    navItems.push({
      href: "/admin/queues",
      label: "Capacity & Reports",
      icon: "availability"
    });
  }

  return (
    <PanelShell
      title="Reception Queue Desk"
      hospitalName={db.websiteSettings.hospitalName}
      user={user}
      navItems={navItems}
    >
      {children}
    </PanelShell>
  );
}
