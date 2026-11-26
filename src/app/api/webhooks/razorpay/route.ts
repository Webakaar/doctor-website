import { NextResponse } from "next/server";
import { generateId, mutateDb } from "@/lib/db";
import { dispatchBookingNotifications } from "@/lib/notifications";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid Razorpay webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
        refund?: {
          entity?: {
            id?: string;
            payment_id?: string;
            status?: string;
          };
        };
      };
    };

    const eventType = payload.event || "";
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    const outcome = await mutateDb((db) => {
      const nowIso = new Date().toISOString();

      if (eventType === "payment.captured" && paymentEntity?.order_id) {
        const payment = db.payments.find(
          (p) => p.razorpayOrderId === paymentEntity.order_id
        );
        if (!payment) return { handled: false as const };

        const appt = db.appointments.find((a) => a.id === payment.appointmentId);
        if (!appt) return { handled: false as const };

        const wasUnpaid = appt.paymentStatus !== "paid";
        payment.razorpayPaymentId = paymentEntity.id || payment.razorpayPaymentId;
        payment.status = "captured";
        payment.rawPayload = payload as unknown as Record<string, unknown>;
        payment.updatedAt = nowIso;

        if (wasUnpaid) {
          const prevStatus = appt.status;
          const nextStatus = db.websiteSettings.bookingSettings
            .requireManualApproval
            ? "pending_confirmation"
            : "confirmed";
          appt.paymentStatus = "paid";
          appt.status = nextStatus;
          appt.holdExpiresAt = undefined;
          appt.updatedAt = nowIso;

          db.appointmentStatusHistory.push({
            id: generateId(),
            appointmentId: appt.id,
            previousStatus: prevStatus,
            newStatus: nextStatus,
            note: `Reconciled via Razorpay webhook (${paymentEntity.id}).`,
            createdAt: nowIso
          });

          const doctor = db.doctors.find((d) => d.id === appt.doctorId)!;
          const service = db.services.find((s) => s.id === appt.serviceId)!;
          return {
            handled: true as const,
            notifyConfirm: nextStatus === "confirmed",
            appointment: appt,
            doctor,
            service,
            settings: db.websiteSettings
          };
        }
        return { handled: true as const, notifyConfirm: false };
      }

      if (eventType === "payment.failed" && paymentEntity?.order_id) {
        const payment = db.payments.find(
          (p) => p.razorpayOrderId === paymentEntity.order_id
        );
        if (!payment) return { handled: false as const };

        payment.status = "failed";
        payment.rawPayload = payload as unknown as Record<string, unknown>;
        payment.updatedAt = nowIso;

        const appt = db.appointments.find((a) => a.id === payment.appointmentId);
        if (appt && appt.paymentStatus !== "paid") {
          const prev = appt.status;
          appt.paymentStatus = "failed";
          appt.status = "cancelled";
          appt.cancellationReason = "Payment failed (Razorpay webhook)";
          appt.holdExpiresAt = undefined;
          appt.updatedAt = nowIso;
          db.appointmentStatusHistory.push({
            id: generateId(),
            appointmentId: appt.id,
            previousStatus: prev,
            newStatus: "cancelled",
            note: "Payment failed via Razorpay webhook.",
            createdAt: nowIso
          });
        }
        return { handled: true as const, notifyConfirm: false };
      }

      if (eventType === "refund.processed" && refundEntity?.payment_id) {
        const payment = db.payments.find(
          (p) => p.razorpayPaymentId === refundEntity.payment_id
        );
        if (payment) {
          payment.status = "refunded";
          payment.refundId = refundEntity.id;
          payment.refundStatus = refundEntity.status || "processed";
          payment.updatedAt = nowIso;

          const appt = db.appointments.find(
            (a) => a.id === payment.appointmentId
          );
          if (appt) {
            appt.paymentStatus = "refunded";
            appt.updatedAt = nowIso;
          }
          return { handled: true as const, notifyConfirm: false };
        }
      }

      return { handled: false as const };
    });

    if (
      outcome.handled &&
      outcome.notifyConfirm &&
      outcome.appointment &&
      outcome.doctor &&
      outcome.service &&
      outcome.settings
    ) {
      await dispatchBookingNotifications({
        event: "appointment_confirmed",
        appointment: outcome.appointment,
        doctor: outcome.doctor,
        service: outcome.service,
        settings: outcome.settings
      });
    }

    return NextResponse.json({ received: true, handled: outcome.handled });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing error." },
      { status: 500 }
    );
  }
}
