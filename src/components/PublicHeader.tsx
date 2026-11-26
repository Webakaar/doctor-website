"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock,
  Cross,
  MapPin,
  Menu,
  Phone,
  PhoneCall,
  UserCircle2,
  X
} from "lucide-react";
import type { PublicUser } from "@/types/hospital";

interface PublicHeaderProps {
  hospitalName: string;
  emergencyPhone: string;
  logoUrl?: string;
  user: PublicUser | null;
}

export function PublicHeader({
  hospitalName,
  emergencyPhone,
  logoUrl,
  user
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const portalHref =
    user?.role === "super_admin" || user?.role === "staff"
      ? "/admin"
      : user?.role === "doctor"
      ? "/doctor"
      : user?.role === "patient"
      ? "/patient"
      : "/login";

  const portalLabel = user
    ? user.role === "patient"
      ? "My Account"
      : user.role === "doctor"
      ? "Doctor Panel"
      : "Admin Panel"
    : "Patient Login";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/doctors", label: "Doctors" },
    { href: "/contact", label: "Contact" }
  ];

  const brandShort = hospitalName.split(" ")[0] || "AuraCare";
  const brandSub =
    hospitalName.split(" ").slice(1).join(" ") || "Multispeciality Hospital";

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md"
          : "border-b border-slate-200/50 bg-white/95 backdrop-blur"
      }`}
    >
      {/* Top Clinical Navy Strip */}
      <div className="bg-[#06213e] px-4 py-1.5 text-[11px] font-medium text-sky-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <PhoneCall className="h-3 w-3 text-sky-300" />
              <span>24×7 Emergency Care</span>
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <MapPin className="h-3 w-3 text-sky-300" />
              <span>Multispeciality Care &amp; Digital Booking</span>
            </span>
          </div>

          <div className="flex items-center gap-x-5">
            <a
              href={`tel:${emergencyPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-sky-200"
            >
              <Phone className="h-3 w-3 text-sky-300" />
              <span>{emergencyPhone}</span>
            </a>
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <Clock className="h-3 w-3 text-sky-300" />
              <span>Open 24 Hours</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Editorial Navigation */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={hospitalName}
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b71c7] to-[#06213e] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Cross className="h-5 w-5" />
            </div>
          )}
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
              {brandShort}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {brandSub}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-slate-50/80 p-1 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-white text-[#0b71c7] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href={portalHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-[#0b71c7]"
          >
            <UserCircle2 className="h-4 w-4 text-[#0b71c7]" />
            <span>{portalLabel}</span>
          </Link>
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 rounded-full bg-[#06213e] py-1.5 pl-4 pr-1.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0b71c7]"
          >
            <span>Book Doctor</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#06213e] transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0b71c7]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3">
              <Link
                href={portalHref}
                onClick={() => setMobileOpen(false)}
                className="btn-secondary w-full rounded-full"
              >
                {portalLabel}
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full rounded-full bg-[#06213e]"
              >
                Book Doctor
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
