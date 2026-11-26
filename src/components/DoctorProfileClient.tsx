"use client";

import { useState } from "react";
import { Lock, Save, Upload } from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";

export function DoctorProfileClient({
  doctor,
  services
}: {
  doctor: Doctor;
  services: Service[];
}) {
  const [biography, setBiography] = useState(doctor.biography);
  const [photoUrl, setPhotoUrl] = useState(doctor.photoUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setPhotoUrl(data.url);
    } else {
      setErr(data.error || "Photo upload failed.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ biography, photoUrl })
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error || "Failed to update profile");
        return;
      }

      if (newPassword) {
        const pwdRes = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        if (!pwdRes.ok) {
          const d = await pwdRes.json();
          setErr(d.error || "Password update failed");
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
      }

      setMsg("Profile updated successfully.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-600">
          Update your biography, photo, and password. Verified qualifications and consultation fees are admin-controlled.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      <form onSubmit={handleSave} className="card-clinical space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl || doctor.photoUrl}
            alt={doctor.fullName}
            className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
          />
          <div>
            <p className="text-lg font-bold text-slate-900">{doctor.fullName}</p>
            <p className="text-xs font-semibold text-brand-700">
              {doctor.specialty}
            </p>
            <label className="btn-secondary mt-2 cursor-pointer px-3 py-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
              <Lock className="h-3 w-3" /> Verified Qualification (Admin-controlled)
            </span>
            <p className="mt-1 font-semibold text-slate-800">
              {doctor.qualification}
            </p>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
              <Lock className="h-3 w-3" /> Consultation Fee (Admin-controlled)
            </span>
            <p className="mt-1 font-semibold text-slate-800">
              ₹{doctor.consultationFee} • {doctor.experienceYears} yrs exp
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="font-semibold text-slate-500">
              Assigned Services:
            </span>{" "}
            <span className="font-semibold text-slate-800">
              {services.map((s) => s.name).join(", ") || "None"}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Professional Biography
          </label>
          <textarea
            rows={4}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            className="input-clinical"
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-xs font-bold uppercase text-slate-500">
            Account Security (Change Password)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="input-clinical"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6)"
              className="input-clinical"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
        </button>
      </form>
    </div>
  );
}
