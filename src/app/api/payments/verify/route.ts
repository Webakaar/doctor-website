import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId, mutateDb } from "@/lib/db";
import { dispatchBookingNotifications } from "@/lib/notifications";
import {
  assignNextQueueNumber,
  inferSessionFromAppointment
} from "@/lib/slots";
import {
  generateDemoPaymentSignature,
  isRazorpayLiveConfigured,
  verifyRazorpayPaymentSignature
} from "@/lib/razorpay";

const verifySchema = z.object({
  appointmentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    const { appointmentId, razorpay_order_id, razorpay_payment_id } = parsed.data;
    let signature = parsed.data.razorpay_signature || "";

    // In demo mode (when live Razorpay keys are not set), allow simulated checkout
    // to sign using the exact server HMAC helper if client passed "demo_checkout"
    if (
      !isRazorpayLiveConfigured() &&
      signature === "demo_checkout_verify"
    ) {
      signature = generateDemoPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id
      );
    }

    const isSignatureValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    const outcome = await mutateDb((db) => {
      const appt = db.appointments.find((a) => a.id === appointmentId);
      if (!appt) {
        return { error: "Appointment not found.", status: 404 as const };
      }

      const payment = db.payments.find(
        (p) =>
          p.appointmentId === appt.id &&
          p.razorpayOrderId === razorpay_order_id
      );
      if (!payment) {
        return { error: "Matching Razorpay order not found.", status: 404 as const };
      }

      // Idempotent guard if webhook or client verified already
      if (payment.status === "captured" && appt.paymentStatus === "paid") {
        const doctor = db.doctors.find((d) => d.id === appt.doctorId)!;
        const service = db.services.find((s) => s.id === appt.serviceId)!;
        return {
          alreadyVerified: true as const,
          appointment: appt,
          payment,
          doctor,
          service,
          settings: db.websiteSettings
        };
      }

      // Ensure appointment wasn't already cancelled due to hold timeout/failure
      if (appt.status === "cancelled") {
        return {
          error:
            "This booking hold expired or was cancelled before payment verification. Please book a new queue spot.",
          status: 409 as const
        };
      }

      const nowIso = new Date().toISOString();
      const prevStatus = appt.status;
      const nextStatus = db.websiteSettings.bookingSettings
        .requireManualApproval
        ? "pending_confirmation"
        : "confirmed";

      const session = inferSessionFromAppointment(appt);
      if (typeof appt.queueNumber !== "number") {
        appt.queueNumber = assignNextQueueNumber({
          appointments: db.appointments,
          doctorId: appt.doctorId,
          appointmentDate: appt.appointmentDate,
          session
        });
      }
      appt.session = session;

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = signature;
      payment.status = "captured";
      payment.updatedAt = nowIso;

      appt.paymentStatus = "paid";
      appt.status = nextStatus;
      appt.holdExpiresAt = undefined;
      appt.updatedAt = nowIso;

      db.appointmentStatusHistory.push({
        id: generateId(),
        appointmentId: appt.id,
        previousStatus: prevStatus,
        newStatus: nextStatus,
        note: `Razorpay payment verified (${razorpay_payment_id}). Assigned Queue Token #${appt.queueNumber}.`,
        createdAt: nowIso
      });

      const doctor = db.doctors.find((d) => d.id === appt.doctorId)!;
      const service = db.services.find((s) => s.id === appt.serviceId)!;

      return {
        alreadyVerified: false as const,
        appointment: appt,
        payment,
        doctor,
        service,
        settings: db.websiteSettings
      };
    });

    if ("error" in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    if (!outcome.alreadyVerified) {
      await dispatchBookingNotifications({
        event: "payment_successful",
        appointment: outcome.appointment,
        doctor: outcome.doctor,
        service: outcome.service,
        settings: outcome.settings
      });

      if (outcome.appointment.status === "confirmed") {
        await dispatchBookingNotifications({
          event: "appointment_confirmed",
          appointment: outcome.appointment,
          doctor: outcome.doctor,
          service: outcome.service,
          settings: outcome.settings
        });
      }
    }

    return NextResponse.json({
      verified: true,
      appointment: outcome.appointment,
      payment: outcome.payment
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}
