import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId, mutateDb } from "@/lib/db";

const failSchema = z.object({
  appointmentId: z.string().min(1),
  razorpay_order_id: z.string().optional(),
  reason: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = failSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await mutateDb((db) => {
      const appt = db.appointments.find(
        (a) => a.id === parsed.data.appointmentId
      );
      if (!appt) {
        return { error: "Appointment not found", status: 404 as const };
      }

      if (appt.paymentStatus === "paid") {
        return {
          error: "Appointment is already paid and cannot be marked failed.",
          status: 400 as const
        };
      }

      const nowIso = new Date().toISOString();
      const prevStatus = appt.status;
      appt.paymentStatus = "failed";
      appt.status = "cancelled";
      appt.cancellationReason =
        parsed.data.reason || "Payment failed or cancelled by patient";
      appt.cancelledAt = nowIso;
      appt.holdExpiresAt = undefined;
      appt.updatedAt = nowIso;

      if (appt.couponCode && prevStatus === "pending_payment") {
        const coupon = db.coupons.find(
          (c) => c.code.toUpperCase() === appt.couponCode?.toUpperCase()
        );
        if (coupon) {
          coupon.usedCount = Math.max(0, coupon.usedCount - 1);
          coupon.updatedAt = nowIso;
        }
      }

      const payment = db.payments.find(
        (p) =>
          p.appointmentId === appt.id &&
          (!parsed.data.razorpay_order_id ||
            p.razorpayOrderId === parsed.data.razorpay_order_id)
      );
      if (payment) {
        payment.status = "failed";
        payment.updatedAt = nowIso;
      }

      db.appointmentStatusHistory.push({
        id: generateId(),
        appointmentId: appt.id,
        previousStatus: prevStatus,
        newStatus: "cancelled",
        note: appt.cancellationReason,
        createdAt: nowIso
      });

      return { appointment: appt };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ appointment: result.appointment });
  } catch {
    return NextResponse.json(
      { error: "Unable to record payment failure." },
      { status: 500 }
    );
  }
}
