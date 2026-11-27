import type {
  AppointmentStatus,
  PaymentRecordStatus,
  PaymentStatus
} from "@/types/hospital";

const APPT_BADGE: Record<AppointmentStatus, { label: string; cls: string }> = {
  pending_payment: {
    label: "Pending Payment",
    cls: "bg-amber-50 text-amber-800 ring-amber-600/20"
  },
  pending_confirmation: {
    label: "Pending Confirmation",
    cls: "bg-sky-50 text-sky-800 ring-sky-600/20"
  },
  confirmed: {
    label: "Confirmed",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
  },
  serving: {
    label: "Serving Now",
    cls: "bg-sky-100 text-sky-900 ring-sky-600/30"
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-rose-50 text-rose-800 ring-rose-600/20"
  },
  completed: {
    label: "Completed",
    cls: "bg-brand-50 text-brand-800 ring-brand-600/20"
  },
  no_show: {
    label: "No-show",
    cls: "bg-slate-100 text-slate-700 ring-slate-500/20"
  }
};

const PAY_BADGE: Record<
  PaymentStatus | PaymentRecordStatus,
  { label: string; cls: string }
> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-800 ring-amber-600/20"
  },
  created: {
    label: "Order Created",
    cls: "bg-slate-100 text-slate-700 ring-slate-500/20"
  },
  authorized: {
    label: "Authorized",
    cls: "bg-sky-50 text-sky-800 ring-sky-600/20"
  },
  paid: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
  },
  captured: {
    label: "Captured",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
  },
  failed: {
    label: "Failed",
    cls: "bg-rose-50 text-rose-800 ring-rose-600/20"
  },
  refunded: {
    label: "Refunded",
    cls: "bg-indigo-50 text-indigo-800 ring-indigo-600/20"
  }
};

export function AppointmentStatusBadge({
  status
}: {
  status: AppointmentStatus;
}) {
  const cfg = APPT_BADGE[status] || APPT_BADGE.pending_payment;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export function PaymentStatusBadge({
  status
}: {
  status: PaymentStatus | PaymentRecordStatus;
}) {
  const cfg = PAY_BADGE[status] || PAY_BADGE.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
