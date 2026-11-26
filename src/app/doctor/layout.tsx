import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PanelShell, type PanelNavItem } from "@/components/PanelShell";

export const dynamic = "force-dynamic";

const DOCTOR_NAV: PanelNavItem[] = [
  { href: "/doctor", label: "Dashboard", icon: "dashboard" },
  { href: "/doctor/appointments", label: "My Appointments", icon: "appointments" },
  { href: "/doctor/patients", label: "Patient Details", icon: "patients" },
  { href: "/doctor/availability", label: "My Availability", icon: "availability" },
  { href: "/doctor/profile", label: "My Profile", icon: "profile" }
];

export default async function DoctorPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (!user) redirect("/login");
  if (user.role !== "doctor") redirect("/login");

  return (
    <PanelShell
      title="Doctor Panel"
      hospitalName={db.websiteSettings.hospitalName}
      user={user}
      navItems={DOCTOR_NAV}
    >
      {children}
    </PanelShell>
  );
}
