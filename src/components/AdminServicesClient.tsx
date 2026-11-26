"use client";

import { useState } from "react";
import { Edit3, Plus, X } from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";
import { ServiceIcon } from "@/components/ServiceIcon";

interface ServiceWithDoctors extends Service {
  doctorIds: string[];
}

const ICON_OPTIONS = [
  "HeartPulse",
  "Bone",
  "Baby",
  "Brain",
  "Sparkles",
  "Stethoscope",
  "ShieldCheck"
];

export function AdminServicesClient({
  initialServices,
  doctors
}: {
  initialServices: ServiceWithDoctors[];
  doctors: Doctor[];
}) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<Partial<ServiceWithDoctors> | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing({
      name: "",
      category: "Speciality Care",
      shortDescription: "",
      fullDescription: "",
      iconName: "Stethoscope",
      imageUrl: "",
      isPublished: true,
      displayOrder: services.length + 1,
      doctorIds: []
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const res = await fetch("/api/admin/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          displayOrder: Number(editing.displayOrder || 0)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to save service.");
        return;
      }
      const saved: ServiceWithDoctors = {
        ...data.service,
        doctorIds: editing.doctorIds || []
      };
      if (isEdit) {
        setServices((prev) =>
          prev
            .map((s) => (s.id === saved.id ? saved : s))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
      } else {
        setServices((prev) =>
          [...prev, saved].sort((a, b) => a.displayOrder - b.displayOrder)
        );
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function toggleDoctor(did: string) {
    if (!editing) return;
    const current = editing.doctorIds || [];
    setEditing({
      ...editing,
      doctorIds: current.includes(did)
        ? current.filter((x) => x !== did)
        : [...current, did]
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Manage Services &amp; Specialities
          </h1>
          <p className="text-sm text-slate-600">
            Add, edit, publish/unpublish, reorder services, and associate doctors.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => (
          <div key={svc.id} className="card-clinical flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <ServiceIcon name={svc.iconName} className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    #{svc.displayOrder}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      svc.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {svc.isPublished ? "Published" : "Unpublished"}
                  </span>
                </div>
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">
                {svc.name}
              </h2>
              <p className="text-xs font-semibold text-brand-700">
                {svc.category}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                {svc.shortDescription}
              </p>
              <p className="mt-3 text-[11px] font-medium text-slate-500">
                {svc.doctorIds.length} associated doctor(s)
              </p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditing(svc)}
                className="btn-secondary w-full py-2 text-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Service</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form
            onSubmit={handleSave}
            className="card-clinical my-8 w-full max-w-2xl space-y-4 p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editing.id ? "Edit Service" : "Add Service"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={editing.name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={editing.category || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Icon
                </label>
                <select
                  value={editing.iconName || "Stethoscope"}
                  onChange={(e) =>
                    setEditing({ ...editing, iconName: e.target.value })
                  }
                  className="input-clinical"
                >
                  {ICON_OPTIONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={editing.displayOrder ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      displayOrder: Number(e.target.value)
                    })
                  }
                  className="input-clinical"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Short Description *
              </label>
              <input
                type="text"
                required
                value={editing.shortDescription || ""}
                onChange={(e) =>
                  setEditing({ ...editing, shortDescription: e.target.value })
                }
                className="input-clinical"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Description *
              </label>
              <textarea
                rows={3}
                required
                value={editing.fullDescription || ""}
                onChange={(e) =>
                  setEditing({ ...editing, fullDescription: e.target.value })
                }
                className="input-clinical"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Associated Doctors
              </label>
              <div className="flex flex-wrap gap-2">
                {doctors.map((d) => {
                  const checked = editing.doctorIds?.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDoctor(d.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        checked
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {d.fullName}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={editing.isPublished ?? true}
                onChange={(e) =>
                  setEditing({ ...editing, isPublished: e.target.checked })
                }
                className="h-4 w-4 rounded text-brand-600"
              />
              <span>Published on Public Website</span>
            </label>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
