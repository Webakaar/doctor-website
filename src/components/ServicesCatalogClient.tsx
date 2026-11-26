"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";
import { ServiceIcon } from "@/components/ServiceIcon";

export function ServicesCatalogClient({
  services,
  doctors
}: {
  services: Service[];
  doctors: Doctor[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    "All",
    ...Array.from(new Set(services.map((s) => s.category)))
  ];

  const filtered = services.filter((s) => {
    const matchesCat = category === "All" || s.category === category;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.shortDescription.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specialities or conditions..."
              className="input-clinical rounded-full py-2.5 pl-11 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  category === cat
                    ? "bg-[#06213e] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#0b71c7]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">
            No matching services found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => {
            const relatedDoctors = doctors.filter((d) =>
              d.serviceIds.includes(service.id)
            );
            const isExpanded = expandedId === service.id;

            return (
              <div
                key={service.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0b71c7] transition group-hover:bg-[#0b71c7] group-hover:text-white">
                      <ServiceIcon name={service.iconName} className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                      {service.category}
                    </span>
                  </div>

                  {service.imageUrl && (
                    <div className="mt-4 flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-[#f8fbff] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                    {service.name}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {service.shortDescription}
                  </p>

                  {isExpanded && (
                    <div className="animate-fade-slide mt-3 rounded-2xl bg-sky-50/70 p-3.5 text-xs leading-relaxed text-slate-700">
                      {service.fullDescription}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : service.id)
                    }
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0b71c7] hover:underline"
                  >
                    <span>
                      {isExpanded ? "Hide overview" : "Quick clinical overview"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {relatedDoctors.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Specialists ({relatedDoctors.length})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {relatedDoctors.map((doc) => (
                          <Link
                            key={doc.id}
                            href={`/doctors/${doc.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-sky-300 hover:text-[#0b71c7]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={doc.photoUrl}
                              alt={doc.fullName}
                              className="h-4 w-4 rounded-full object-cover object-top"
                            />
                            <span>{doc.fullName}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4">
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-[#0b71c7]"
                  >
                    Full Details
                  </Link>
                  <Link
                    href={`/book?service=${service.id}`}
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#06213e] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b71c7]"
                  >
                    <span>Book Doctor</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
