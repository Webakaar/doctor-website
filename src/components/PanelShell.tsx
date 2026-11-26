"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Cross,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Tag,
  UserCog,
  Users,
  X
} from "lucide-react";
import type { PublicUser } from "@/types/hospital";

export interface PanelNavItem {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "doctors"
    | "services"
    | "appointments"
    | "patients"
    | "payments"
    | "coupons"
    | "notifications"
    | "settings"
    | "availability"
    | "profile";
}

const ICONS = {
  dashboard: LayoutDashboard,
  doctors: Stethoscope,
  services: Cross,
  appointments: CalendarDays,
  patients: Users,
  payments: CreditCard,
  coupons: Tag,
  notifications: Bell,
  settings: Settings,
  availability: CalendarClock,
  profile: UserCog
};

export function PanelShell({
  title,
  hospitalName,
  user,
  navItems,
  children
}: {
  title: string;
  hospitalName: string;
  user: PublicUser;
  navItems: PanelNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-950 p-4 text-slate-200">
      <div>
        <div className="flex items-center justify-between px-2 py-2">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Cross className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold">{hospitalName}</span>
              <span className="block text-[11px] text-brand-300">{title}</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/admin" || item.href === "/doctor"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-slate-800 pt-4">
        <div className="rounded-xl bg-slate-900 px-3 py-2.5">
          <p className="truncate text-xs font-bold text-white">
            {user.fullName}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-brand-300">
            {user.role.replace("_", " ")}
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Public Website</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 hover:text-rose-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64">{sidebarContent}</div>
          <div
            className="flex-1 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:hidden">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
