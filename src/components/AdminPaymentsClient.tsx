"use client";

import { useState } from "react";
import { RefreshCw, RotateCcw, Search } from "lucide-react";
import type { AppointmentStatus, PaymentRecord } from "@/types/hospital";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";

export interface AdminPaymentRow extends PaymentRecord {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentStatus: AppointmentStatus | "";
}

export function AdminPaymentsClient({
  initialPayments
}: {
  initialPayments: AdminPaymentRow[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = payments.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      p.bookingRef.toLowerCase().includes(q) ||
      p.razorpayOrderId.toLowerCase().includes(q) ||
      (p.razorpayPaymentId || "").toLowerCase().includes(q) ||
      p.patientName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  async function runAction(
    paymentId: string,
    action: "reconcile_captured" | "refund"
  ) {
    setBusyId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Payment action failed");
        return;
      }
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, ...data.payment } : p
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Manage Payments (Razorpay)
        </h1>
        <p className="text-sm text-slate-600">
          Audit server-verified Razorpay orders, payment captures, and refund records.
        </p>
      </div>

      <div className="card-clinical flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Booking Ref, Razorpay Order/Payment ID, or Patient..."
            className="input-clinical pl-10 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-clinical w-auto text-xs"
        >
          <option value="all">All Payment Statuses</option>
          <option value="captured">Captured</option>
          <option value="created">Order Created</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card-clinical overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking Ref</th>
                <th className="px-4 py-3">Razorpay References</th>
                <th className="px-4 py-3">Patient &amp; Doctor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">
                    {p.bookingRef}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                    <p>Order: {p.razorpayOrderId}</p>
                    {p.razorpayPaymentId && <p>Pay: {p.razorpayPaymentId}</p>}
                    {p.refundId && (
                      <p className="text-indigo-700">Refund: {p.refundId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-slate-900">
                      {p.patientName}
                    </p>
                    <p className="text-slate-500">{p.doctorName}</p>
                    {p.appointmentStatus && (
                      <div className="mt-1">
                        <AppointmentStatusBadge status={p.appointmentStatus} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    ₹{p.amount} {p.currency}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "created" && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => runAction(p.id, "reconcile_captured")}
                          className="btn-secondary px-2.5 py-1.5 text-[11px]"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Reconcile</span>
                        </button>
                      )}
                      {p.status === "captured" && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => runAction(p.id, "refund")}
                          className="btn-secondary border-indigo-200 px-2.5 py-1.5 text-[11px] text-indigo-700"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Issue Refund</span>
                        </button>
                      )}
                    </div>
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
