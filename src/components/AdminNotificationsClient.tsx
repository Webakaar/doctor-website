"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone, Save, Send } from "lucide-react";
import type {
  NotificationChannel,
  NotificationChannelConfig,
  NotificationLog
} from "@/types/hospital";

const EVENT_ROWS: {
  key: keyof NotificationChannelConfig["events"];
  label: string;
}[] = [
  { key: "bookingReceived", label: "Booking received" },
  { key: "paymentSuccessful", label: "Payment successful" },
  { key: "appointmentConfirmed", label: "Appointment confirmed" },
  { key: "appointmentCancelled", label: "Appointment cancelled" },
  { key: "appointmentReminder", label: "Appointment reminder" }
];

export function AdminNotificationsClient({
  initialConfig,
  initialLogs
}: {
  initialConfig: NotificationChannelConfig;
  initialLogs: NotificationLog[];
}) {
  const [cfg, setCfg] = useState(initialConfig);
  const [logs, setLogs] = useState(initialLogs);
  const [testEmail, setTestEmail] = useState("patient@auracare.example");
  const [testSmsMobile, setTestSmsMobile] = useState("+91 98200 22001");
  const [testWaMobile, setTestWaMobile] = useState("+91 98200 22001");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg)
      });
      if (res.ok) {
        setMsg("Notification channel settings saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function runTest(channel: NotificationChannel, recipient: string) {
    setMsg("");
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, recipient })
    });
    const data = await res.json();
    if (res.ok && data.log) {
      setLogs((prev) => [data.log, ...prev]);
      setMsg(
        `Test ${channel.toUpperCase()} status: ${data.result.status}${
          data.result.providerMessageId
            ? ` (${data.result.providerMessageId})`
            : ""
        }`
      );
    }
  }

  function toggleEvent(
    eventKey: keyof NotificationChannelConfig["events"],
    channel: "email" | "sms" | "whatsapp" | "adminAlert"
  ) {
    setCfg((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: {
          ...prev.events[eventKey],
          [channel]: !prev.events[eventKey][channel]
        }
      }
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Notification Settings (Email, SMS &amp; WhatsApp)
          </h1>
          <p className="text-sm text-slate-600">
            Configure Nodemailer SMTP, MSG91 SMS, WhatsApp Business templates, event triggers, and inspect delivery logs.
          </p>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {msg}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Email SMTP */}
          <div className="card-clinical space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Mail className="h-4 w-4 text-brand-600" />
                <h2>Email (Nodemailer SMTP)</h2>
              </div>
              <input
                type="checkbox"
                checked={cfg.emailEnabled}
                onChange={(e) =>
                  setCfg({ ...cfg, emailEnabled: e.target.checked })
                }
                className="h-4 w-4 rounded text-brand-600"
              />
            </div>

            <input
              type="text"
              placeholder="SMTP Host (e.g. smtp.gmail.com)"
              value={cfg.smtpHost}
              onChange={(e) => setCfg({ ...cfg, smtpHost: e.target.value })}
              className="input-clinical text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Port (587)"
                value={cfg.smtpPort}
                onChange={(e) =>
                  setCfg({ ...cfg, smtpPort: Number(e.target.value) })
                }
                className="input-clinical text-xs"
              />
              <input
                type="text"
                placeholder="Sender Name"
                value={cfg.senderName}
                onChange={(e) =>
                  setCfg({ ...cfg, senderName: e.target.value })
                }
                className="input-clinical text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="SMTP Username"
              value={cfg.smtpUser}
              onChange={(e) => setCfg({ ...cfg, smtpUser: e.target.value })}
              className="input-clinical text-xs"
            />
            <input
              type="password"
              placeholder="SMTP Password / App Key"
              value={cfg.smtpPass}
              onChange={(e) => setCfg({ ...cfg, smtpPass: e.target.value })}
              className="input-clinical text-xs"
            />
            <input
              type="email"
              placeholder="Sender Email"
              value={cfg.senderEmail}
              onChange={(e) =>
                setCfg({ ...cfg, senderEmail: e.target.value })
              }
              className="input-clinical text-xs"
            />

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input-clinical py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => runTest("email", testEmail)}
                className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
              >
                <Send className="h-3 w-3" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* SMS MSG91 */}
          <div className="card-clinical space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Phone className="h-4 w-4 text-brand-600" />
                <h2>SMS (MSG91)</h2>
              </div>
              <input
                type="checkbox"
                checked={cfg.smsEnabled}
                onChange={(e) =>
                  setCfg({ ...cfg, smsEnabled: e.target.checked })
                }
                className="h-4 w-4 rounded text-brand-600"
              />
            </div>

            <input
              type="password"
              placeholder="MSG91 Auth Key"
              value={cfg.msg91AuthKey}
              onChange={(e) =>
                setCfg({ ...cfg, msg91AuthKey: e.target.value })
              }
              className="input-clinical text-xs"
            />
            <input
              type="text"
              placeholder="Sender ID (e.g. AURACR)"
              value={cfg.msg91SenderId}
              onChange={(e) =>
                setCfg({ ...cfg, msg91SenderId: e.target.value })
              }
              className="input-clinical text-xs"
            />
            <input
              type="text"
              placeholder="Approved DLT Template ID"
              value={cfg.msg91SmsTemplateId}
              onChange={(e) =>
                setCfg({ ...cfg, msg91SmsTemplateId: e.target.value })
              }
              className="input-clinical text-xs"
            />

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="tel"
                value={testSmsMobile}
                onChange={(e) => setTestSmsMobile(e.target.value)}
                className="input-clinical py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => runTest("sms", testSmsMobile)}
                className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
              >
                <Send className="h-3 w-3" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="card-clinical space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <h2>WhatsApp Business API</h2>
              </div>
              <input
                type="checkbox"
                checked={cfg.whatsappEnabled}
                onChange={(e) =>
                  setCfg({ ...cfg, whatsappEnabled: e.target.checked })
                }
                className="h-4 w-4 rounded text-brand-600"
              />
            </div>

            <select
              value={cfg.whatsappProvider}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  whatsappProvider: e.target.value as "msg91" | "meta_cloud"
                })
              }
              className="input-clinical text-xs"
            >
              <option value="msg91">MSG91 WhatsApp</option>
              <option value="meta_cloud">Meta WhatsApp Cloud API</option>
            </select>

            <input
              type="password"
              placeholder="WhatsApp API Key / Auth Key"
              value={cfg.whatsappApiKey}
              onChange={(e) =>
                setCfg({ ...cfg, whatsappApiKey: e.target.value })
              }
              className="input-clinical text-xs"
            />
            <input
              type="text"
              placeholder="Integrated WhatsApp Number"
              value={cfg.whatsappIntegratedNumber}
              onChange={(e) =>
                setCfg({ ...cfg, whatsappIntegratedNumber: e.target.value })
              }
              className="input-clinical text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Confirmed Template"
                value={cfg.whatsappTemplateConfirmed}
                onChange={(e) =>
                  setCfg({ ...cfg, whatsappTemplateConfirmed: e.target.value })
                }
                className="input-clinical text-xs"
              />
              <input
                type="text"
                placeholder="Cancelled Template"
                value={cfg.whatsappTemplateCancelled}
                onChange={(e) =>
                  setCfg({ ...cfg, whatsappTemplateCancelled: e.target.value })
                }
                className="input-clinical text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="Variable Mapping"
              value={cfg.whatsappVariableMapping}
              onChange={(e) =>
                setCfg({ ...cfg, whatsappVariableMapping: e.target.value })
              }
              className="input-clinical text-xs"
            />

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="tel"
                value={testWaMobile}
                onChange={(e) => setTestWaMobile(e.target.value)}
                className="input-clinical py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => runTest("whatsapp", testWaMobile)}
                className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
              >
                <Send className="h-3 w-3" />
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Event Matrix */}
        <div className="card-clinical p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Booking Notification Events Matrix
            </h2>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Notification Settings"}</span>
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 pr-4">Event</th>
                  <th className="py-2.5 px-4 text-center">Patient Email</th>
                  <th className="py-2.5 px-4 text-center">Patient SMS</th>
                  <th className="py-2.5 px-4 text-center">Patient WhatsApp</th>
                  <th className="py-2.5 px-4 text-center">Admin Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EVENT_ROWS.map((row) => {
                  const val = cfg.events[row.key];
                  return (
                    <tr key={row.key}>
                      <td className="py-3 pr-4 font-semibold text-slate-800">
                        {row.label}
                      </td>
                      {(
                        ["email", "sms", "whatsapp", "adminAlert"] as const
                      ).map((ch) => (
                        <td key={ch} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={val[ch]}
                            onChange={() => toggleEvent(row.key, ch)}
                            className="h-4 w-4 rounded text-brand-600"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      {/* Delivery Logs */}
      <div className="card-clinical p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Notification Delivery Logs
        </h2>
        <p className="text-xs text-slate-500">
          Tracks channel, event, recipient reference, provider message ID, and status without storing sensitive message bodies.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Channel</th>
                <th className="px-3 py-2.5">Event</th>
                <th className="px-3 py-2.5">Recipient</th>
                <th className="px-3 py-2.5">Provider Message ID</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2.5 font-bold uppercase text-slate-800">
                    {l.channel}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{l.event}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-700">
                    {l.recipientRef}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">
                    {l.providerMessageId || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        l.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : l.status === "simulated"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {new Date(l.sentAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
