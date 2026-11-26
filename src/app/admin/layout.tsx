import { redirect } from "next/navigation";
import {
  canAccessAdminPanel,
  getCurrentUser,
  hasAdminPermission
} from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PanelShell, type PanelNavItem } from "@/components/PanelShell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!user || !canAccessAdminPanel(user)) {
    redirect("/login");
  }

  const navItems: PanelNavItem[] = [];
  if (hasAdminPermission(user, "view_dashboard")) {
    navItems.push({ href: "/admin", label: "Dashboard", icon: "dashboard" });
  }
  if (hasAdminPermission(user, "manage_doctors")) {
    navItems.push({
      href: "/admin/doctors",
      label: "Manage Doctors",
      icon: "doctors"
    });
  }
  if (hasAdminPermission(user, "manage_services")) {
    navItems.push({
      href: "/admin/services",
      label: "Manage Services",
      icon: "services"
    });
  }
  if (hasAdminPermission(user, "manage_appointments")) {
    navItems.push({
      href: "/admin/appointments",
      label: "Manage Appointments",
      icon: "appointments"
    });
  }
  if (hasAdminPermission(user, "manage_patients")) {
    navItems.push({
      href: "/admin/patients",
      label: "Manage Patients",
      icon: "patients"
    });
  }
  if (hasAdminPermission(user, "manage_payments")) {
    navItems.push({
      href: "/admin/payments",
      label: "Manage Payments",
      icon: "payments"
    });
  }
  if (
    hasAdminPermission(user, "manage_payments") ||
    hasAdminPermission(user, "manage_website")
  ) {
    navItems.push({
      href: "/admin/coupons",
      label: "Manage Coupons",
      icon: "coupons"
    });
  }
  if (hasAdminPermission(user, "manage_notifications")) {
    navItems.push({
      href: "/admin/notifications",
      label: "Notification Settings",
      icon: "notifications"
    });
  }
  if (hasAdminPermission(user, "manage_website")) {
    navItems.push({
      href: "/admin/settings",
      label: "Website Settings",
      icon: "settings"
    });
  }

  return (
    <PanelShell
      title="Admin Panel"
      hospitalName={db.websiteSettings.hospitalName}
      user={user}
      navItems={navItems}
    >
      {children}
    </PanelShell>
  );
}
