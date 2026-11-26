"use client";

import { useState } from "react";
import { CalendarClock, Edit3, Plus, Upload, X } from "lucide-react";
import type {
  BlockedSlot,
  Doctor,
  DoctorSchedule,
  Service
} from "@/types/hospital";
import { DoctorAvailabilityClient } from "@/components/DoctorAvailabilityClient";

interface DoctorWithAccount extends Doctor {
  accountEmail: string | null;
}

export function AdminDoctorsClient({
  initialDoctors,
  services,
  schedules,
  blockedSlots
}: {
  initialDoctors: DoctorWithAccount[];
  services: Service[];
  schedules: DoctorSchedule[];
  blockedSlots: BlockedSlot[];
}) {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [editing, setEditing] = useState<Partial<DoctorWithAccount> & {
    loginEmail?: string;
    loginPassword?: string;
  } | null>(null);
  const [availDoctor, setAvailDoctor] = useState<DoctorWithAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openNew() {
    setError("");
    setEditing({
      fullName: "",
      photoUrl: "",
      qualification: "",
      experienceYears: 5,
      specialty: "",
      biography: "",
      consultationFee: 700,
      slotDurationMins: 30,
      serviceIds: services[0] ? [services[0].id] : [],
      isActive: true,
      isVisible: true,
      loginEmail: "",
      loginPassword: ""
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setEditing({ ...editing, photoUrl: data.url });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const res = await fetch("/api/admin/doctors", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          experienceYears: Number(editing.experienceYears),
          consultationFee: Number(editing.consultationFee),
          slotDurationMins: Number(editing.slotDurationMins || 30)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save doctor.");
        return;
      }

      if (isEdit) {
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === data.doctor.id ? { ...d, ...data.doctor } : d
          )
        );
      } else {
        setDoctors((prev) => [
          ...prev,
          { ...data.doctor, accountEmail: editing.loginEmail || null }
        ]);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function toggleService(sid: string) {
    if (!editing) return;
    const current = editing.serviceIds || [];
    const next = current.includes(sid)
      ? current.filter((x) => x !== sid)
      : [...current, sid];
    setEditing({ ...editing, serviceIds: next });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Manage Doctors
          </h1>
          <p className="text-sm text-slate-600">
            Create doctor profiles, assign services, set consultation fees, control visibility, and manage availability.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc) => (
          <div key={doc.id} className="card-clinical flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.photoUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%230284c7'/%3E%3C/svg%3E"}
                  alt={doc.fullName}
                  className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        doc.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {doc.isActive ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        doc.isVisible
                          ? "bg-sky-50 text-sky-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {doc.isVisible ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate text-base font-bold text-slate-900">
                    {doc.fullName}
                  </h2>
                  <p className="text-xs font-semibold text-brand-700">
                    {doc.specialty}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">{doc.qualification}</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                ₹{doc.consultationFee} • {doc.experienceYears} yrs •{" "}
                {doc.slotDurationMins}m slots
              </p>
              {doc.accountEmail && (
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  Login: {doc.accountEmail}
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setEditing(doc);
                }}
                className="btn-secondary px-3 py-2 text-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setAvailDoctor(doc)}
                className="btn-secondary px-3 py-2 text-xs"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Availability</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Doctor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form
            onSubmit={handleSave}
            className="card-clinical my-8 w-full max-w-2xl space-y-4 p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editing.id ? "Edit Doctor Profile" : "Add New Doctor"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editing.fullName || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, fullName: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Specialty / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editing.specialty || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, specialty: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Qualifications *
                </label>
                <input
                  type="text"
                  required
                  value={editing.qualification || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, qualification: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Experience (yrs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.experienceYears ?? 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        experienceYears: Number(e.target.value)
                      })
                    }
                    className="input-clinical"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Fee (INR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editing.consultationFee ?? 500}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        consultationFee: Number(e.target.value)
                      })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Slot Duration
                </label>
                <select
                  value={editing.slotDurationMins || 30}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      slotDurationMins: Number(e.target.value) as Doctor["slotDurationMins"]
                    })
                  }
                  className="input-clinical"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Profile Photo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editing.photoUrl || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, photoUrl: e.target.value })
                    }
                    placeholder="Image URL or upload"
                    className="input-clinical text-xs"
                  />
                  <label className="btn-secondary shrink-0 cursor-pointer px-3 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Associated Services
              </label>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const checked = editing.serviceIds?.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        checked
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Biography
              </label>
              <textarea
                rows={3}
                value={editing.biography || ""}
                onChange={(e) =>
                  setEditing({ ...editing, biography: e.target.value })
                }
                className="input-clinical"
              />
            </div>

            {!editing.id && (
              <div className="grid gap-3 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Doctor Panel Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={editing.loginEmail || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, loginEmail: e.target.value })
                    }
                    placeholder="doctor@auracare.example"
                    className="input-clinical text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editing.loginPassword || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, loginPassword: e.target.value })
                    }
                    placeholder="Defaults to Demo@1234"
                    className="input-clinical text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editing.isActive ?? true}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span>Active Doctor</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editing.isVisible ?? true}
                  onChange={(e) =>
                    setEditing({ ...editing, isVisible: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span>Visible on Public Website</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Doctor"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Availability Modal */}
      {availDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="card-clinical my-8 max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAvailDoctor(null)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Close Availability Editor
              </button>
            </div>
            <DoctorAvailabilityClient
              doctorId={availDoctor.id}
              doctorName={availDoctor.fullName}
              initialSchedules={schedules.filter(
                (s) => s.doctorId === availDoctor.id
              )}
              initialBlocks={blockedSlots.filter(
                (b) => b.doctorId === availDoctor.id
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
