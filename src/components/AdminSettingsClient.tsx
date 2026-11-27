"use client";

import { useState } from "react";
import { Save, Upload } from "lucide-react";
import type {
  Enquiry,
  PublicUser,
  StaffPermissions,
  WebsiteSettings
} from "@/types/hospital";

export function AdminSettingsClient({
  initialSettings,
  initialEnquiries,
  initialStaff,
  isSuperAdmin
}: {
  initialSettings: WebsiteSettings;
  initialEnquiries: Enquiry[];
  initialStaff: Omit<PublicUser, "doctorId">[];
  isSuperAdmin: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [staff, setStaff] = useState(initialStaff);
  const [tab, setTab] = useState<
    "general" | "content" | "booking" | "enquiries" | "permissions"
  >("general");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function saveWebsiteSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMsg("Website settings saved and published.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setSettings({ ...settings, logoUrl: data.url });
    }
  }

  async function updateEnquiryStatus(
    id: string,
    status: Enquiry["status"]
  ) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiryId: id, enquiryStatus: status })
    });
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
  }

  async function toggleStaffPermission(
    staffId: string,
    key: keyof StaffPermissions
  ) {
    const target = staff.find((s) => s.id === staffId);
    if (!target) return;
    const updatedPerms: StaffPermissions = {
      ...target.permissions,
      [key]: !target.permissions[key]
    };
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, permissions: updatedPerms })
    });
    if (res.ok) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, permissions: updatedPerms } : s
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Website Settings, Rules &amp; Enquiries
        </h1>
        <p className="text-sm text-slate-600">
          Manage hospital branding, homepage &amp; About content, SEO metadata, booking policy, enquiries, and staff permissions.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "general", label: "Hospital & Contact" },
          { key: "content", label: "Home, About & SEO" },
          { key: "booking", label: "Booking & Cancellation Rules" },
          { key: "enquiries", label: `Contact Enquiries (${enquiries.length})` },
          ...(isSuperAdmin
            ? [{ key: "permissions", label: "Staff Permissions" }]
            : [])
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              tab === t.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "general" || tab === "content" || tab === "booking") && (
        <form onSubmit={saveWebsiteSettings} className="card-clinical space-y-5 p-6">
          {tab === "general" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Hospital Name
                </label>
                <input
                  type="text"
                  value={settings.hospitalName}
                  onChange={(e) =>
                    setSettings({ ...settings, hospitalName: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Emergency Phone
                </label>
                <input
                  type="text"
                  value={settings.emergencyPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, emergencyPhone: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Hospital Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Logo Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, logoUrl: e.target.value })
                    }
                    placeholder="Optional logo URL"
                    className="input-clinical text-xs"
                  />
                  <label className="btn-secondary shrink-0 cursor-pointer px-3 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={settings.workingHours}
                  onChange={(e) =>
                    setSettings({ ...settings, workingHours: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) =>
                    setSettings({ ...settings, footerText: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>
            </div>
          )}

          {tab === "content" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Homepage Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, heroTitle: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Hero CTA Label
                  </label>
                  <input
                    type="text"
                    value={settings.heroCtaText}
                    onChange={(e) =>
                      setSettings({ ...settings, heroCtaText: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Homepage Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={settings.heroSubtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSubtitle: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  About Page Intro
                </label>
                <textarea
                  rows={3}
                  value={settings.aboutIntro}
                  onChange={(e) =>
                    setSettings({ ...settings, aboutIntro: e.target.value })
                  }
                  className="input-clinical"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mission
                  </label>
                  <textarea
                    rows={2}
                    value={settings.aboutMission}
                    onChange={(e) =>
                      setSettings({ ...settings, aboutMission: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Vision
                  </label>
                  <textarea
                    rows={2}
                    value={settings.aboutVision}
                    onChange={(e) =>
                      setSettings({ ...settings, aboutVision: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>

              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    SEO Home Title
                  </label>
                  <input
                    type="text"
                    value={settings.seoSettings.homeTitle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seoSettings: {
                          ...settings.seoSettings,
                          homeTitle: e.target.value
                        }
                      })
                    }
                    className="input-clinical text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    SEO Home Meta Description
                  </label>
                  <input
                    type="text"
                    value={settings.seoSettings.homeDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seoSettings: {
                          ...settings.seoSettings,
                          homeDescription: e.target.value
                        }
                      })
                    }
                    className="input-clinical text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "booking" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-4 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={
                    settings.bookingSettings.paymentMandatoryForConfirmation
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        paymentMandatoryForConfirmation: e.target.checked
                      }
                    })
                  }
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span>
                  Require Online Payment (Razorpay) Before Confirmation
                </span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-4 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.bookingSettings.requireManualApproval}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        requireManualApproval: e.target.checked
                      }
                    })
                  }
                  className="h-4 w-4 rounded text-brand-600"
                />
                <span>Require Manual Confirmation by Hospital Staff</span>
              </label>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Checkout Slot Hold Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={settings.bookingSettings.slotHoldMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        slotHoldMinutes: Number(e.target.value)
                      }
                    })
                  }
                  className="input-clinical"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Patient Cancellation Window (Hours Before Booking Window)
                </label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={settings.bookingSettings.cancellationWindowHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        cancellationWindowHours: Number(e.target.value)
                      }
                    })
                  }
                  className="input-clinical"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Internal Estimation Per Patient (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.bookingSettings.queueMinutesPerPatient ?? 15}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        queueMinutesPerPatient: Number(e.target.value)
                      }
                    })
                  }
                  className="input-clinical"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Configurable Buffer Per Window (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={settings.bookingSettings.queueBufferMinutes ?? 15}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bookingSettings: {
                        ...settings.bookingSettings,
                        queueBufferMinutes: Number(e.target.value)
                      }
                    })
                  }
                  className="input-clinical"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Website Settings"}</span>
            </button>
          </div>
        </form>
      )}

      {tab === "enquiries" && (
        <div className="card-clinical overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">Subject &amp; Message</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-bold text-slate-900">{e.name}</p>
                    <p className="text-slate-600">{e.phone}</p>
                    <p className="text-slate-500">{e.email}</p>
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs">
                    <p className="font-semibold text-brand-700">{e.subject}</p>
                    <p className="mt-1 text-slate-600">{e.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={e.status}
                      onChange={(ev) =>
                        updateEnquiryStatus(
                          e.id,
                          ev.target.value as Enquiry["status"]
                        )
                      }
                      className="input-clinical w-auto py-1 text-xs"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "permissions" && isSuperAdmin && (
        <div className="card-clinical p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Hospital Staff Role Permissions
          </h2>
          <p className="text-xs text-slate-500">
            Control which Admin Panel modules and APIs each staff account may access.
          </p>

          <div className="mt-4 space-y-4">
            {staff
              .filter((s) => s.role === "staff")
              .map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-bold text-slate-900">
                    {member.fullName}{" "}
                    <span className="font-mono text-xs font-normal text-slate-500">
                      ({member.email})
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(
                      [
                        "view_dashboard",
                        "manage_doctors",
                        "manage_services",
                        "manage_appointments",
                        "manage_queue",
                        "manage_patients",
                        "manage_payments",
                        "manage_notifications",
                        "manage_website"
                      ] as const
                    ).map((perm) => (
                      <label
                        key={perm}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(member.permissions[perm])}
                          onChange={() =>
                            toggleStaffPermission(member.id, perm)
                          }
                          className="h-3.5 w-3.5 rounded text-brand-600"
                        />
                        <span>{perm.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
