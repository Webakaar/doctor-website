import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import { initiateRazorpayRefund } from "@/lib/razorpay";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_payments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const payments = db.payments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => {
      const appt = db.appointments.find((a) => a.id === p.appointmentId);
      const doctor = appt
        ? db.doctors.find((d) => d.id === appt.doctorId)
        : undefined;
      return {
        ...p,
        patientName: appt?.patientName || "Unknown",
        patientEmail: appt?.patientEmail || "",
        doctorName: doctor?.fullName || "Unknown",
        appointmentDate: appt?.appointmentDate || "",
        appointmentStatus: appt?.status || ""
      };
    });

  return NextResponse.json({ payments });
}

const actionSchema = z.object({
  paymentId: z.string().min(1),
  action: z.enum(["reconcile_captured", "refund"])
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_payments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await mutateDb(async (db) => {
    const payment = db.payments.find((p) => p.id === parsed.data.paymentId);
    if (!payment) return { error: "Payment record not found", status: 404 as const };

    const appt = db.appointments.find((a) => a.id === payment.appointmentId);
    const nowIso = new Date().toISOString();

    if (parsed.data.action === "reconcile_captured") {
      payment.status = "captured";
      payment.updatedAt = nowIso;
      if (appt) {
        const prev = appt.status;
        appt.paymentStatus = "paid";
        if (appt.status === "pending_payment") {
          appt.status = "confirmed";
          appt.holdExpiresAt = undefined;
          db.appointmentStatusHistory.push({
            id: generateId(),
            appointmentId: appt.id,
            previousStatus: prev,
            newStatus: "confirmed",
            changedBy: user?.id,
            changedByName: user?.fullName,
            note: "Payment manually reconciled by admin.",
            createdAt: nowIso
          });
        }
        appt.updatedAt = nowIso;
      }
      return { payment };
    }

    if (parsed.data.action === "refund") {
      if (payment.status !== "captured") {
        return {
          error: "Only captured payments can be refunded.",
          status: 400 as const
        };
      }
      const refund = await initiateRazorpayRefund({
        paymentId: payment.razorpayPaymentId || payment.razorpayOrderId,
        amountInr: payment.amount
      });
      payment.status = "refunded";
      payment.refundId = refund.refundId;
      payment.refundStatus = refund.status;
      payment.updatedAt = nowIso;
      if (appt) {
        appt.paymentStatus = "refunded";
        appt.updatedAt = nowIso;
      }
      return { payment };
    }

    return { error: "Unsupported action", status: 400 as const };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ payment: result.payment });
}
