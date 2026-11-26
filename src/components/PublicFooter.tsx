import Link from "next/link";
import { ArrowUpRight, Clock, Cross, Mail, MapPin, Phone } from "lucide-react";
import type { WebsiteSettings } from "@/types/hospital";

export function PublicFooter({ settings }: { settings: WebsiteSettings }) {
  return (
    <footer className="relative mt-8 bg-gradient-to-b from-[#f3f8fe] via-[#2563eb] to-[#1d4ed8] pb-10 pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Elevated Crisp White Editorial Footer Card */}
        <div className="overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl shadow-blue-950/20 sm:p-12">
          {/* Top Bar inside Footer Card */}
          <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#06213e] text-white">
                <Cross className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-extrabold text-slate-900">
                  {settings.hospitalName}
                </span>
                <span className="block text-xs text-slate-500">
                  {settings.tagline}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 sm:text-sm">
                Ready for your consultation?
              </span>
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 rounded-full bg-[#0b71c7] py-2 pl-5 pr-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#06213e]"
              >
                <span>Book Appointment</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b71c7] transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Main Columns */}
          <div className="mt-8 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Care Philosophy
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {settings.aboutMission}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>24×7 Emergency: {settings.emergencyPhone}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Hospital Pages
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm font-medium text-slate-700">
                <li>
                  <Link href="/" className="hover:text-[#0b71c7]">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-[#0b71c7]">
                    About Hospital
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-[#0b71c7]">
                    Medical Services
                  </Link>
                </li>
                <li>
                  <Link href="/doctors" className="hover:text-[#0b71c7]">
                    Our Specialists
                  </Link>
                </li>
                <li>
                  <Link href="/book" className="hover:text-[#0b71c7]">
                    Book Doctor
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#0b71c7]">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Digital Portals
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm font-medium text-slate-700">
                <li>
                  <Link href="/login" className="hover:text-[#0b71c7]">
                    Patient Login &amp; Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/patient" className="hover:text-[#0b71c7]">
                    Patient Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/doctor" className="hover:text-[#0b71c7]">
                    Doctor Panel
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-[#0b71c7]">
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Hospital Address
              </h3>
              <ul className="mt-3 space-y-3 text-xs text-slate-600 sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0b71c7]" />
                  <span>{settings.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[#0b71c7]" />
                  <span>{settings.phone}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#0b71c7]" />
                  <span>{settings.email}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-[#0b71c7]" />
                  <span>{settings.workingHours}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>{settings.footerText}</p>
            <div className="flex items-center gap-5 font-semibold">
              <Link href="/about" className="hover:text-[#0b71c7]">
                Accreditations
              </Link>
              <Link href="/contact" className="hover:text-[#0b71c7]">
                Privacy &amp; Enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
