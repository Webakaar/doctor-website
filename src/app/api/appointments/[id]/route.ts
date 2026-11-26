import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import { dispatchBookingNotifications } from "@/lib/notifications";
import { initiateRazorpayRefund } from "@/lib/razorpay";
import { evaluateCancellationEligibility } from "@/lib/slots";
import type { AppointmentStatus } from "@/types/hospital";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await readDb();
  const appt = db.appointments.find((a) => a.id === id);
  if (!appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const isAdmin = hasAdminPermission(user, "manage_appointments");
  const isAssignedDoctor =
    user.role === "doctor" && user.doctorId === appt.doctorId;
  const isOwnerPatient =
    user.role === "patient" &&
    (appt.patientId === user.id ||
      appt.patientEmail.toLowerCase() === user.email.toLowerCase());

  if (!isAdmin && !isAssignedDoctor && !isOwnerPatient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const doctor = db.doctors.find((d) => d.id === appt.doctorId);
  const service = db.services.find((s) => s.id === appt.serviceId);
  const payment = db.payments.find((p) => p.appointmentId === appt.id);
  const history = db.appointmentStatusHistory
    .filter((h) => h.appointmentId === appt.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notifications = isAdmin
    ? db.notificationLogs.filter((n) => n.appointmentId === appt.id)
    : [];

  return NextResponse.json({
    appointment: appt,
    doctor,
    service,
    payment,
    history,
    notifications,
    cancellationEligibility: evaluateCancellationEligibility({
      appointment: appt,
      rules: db.websiteSettings.bookingSettings
    })
  });
}

const patchAppointmentSchema = z.object({
  action: z.enum(["cancel", "update_status", "update_notes"]),
  status: z
    .enum([
      "pending_payment",
      "pending_confirmation",
      "confirmed",
      "cancelled",
      "completed",
      "no_show"
    ])
    .optional(),
  reason: z.string().max(400).optional(),
  notes: z.string().max(1000).optional()
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = patchAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid appointment update payload." },
      { status: 400 }
    );
  }

  const { action, status, reason, notes } = parsed.data;

  const outcome = await mutateDb(async (db) => {
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) {
      return { error: "Appointment not found", status: 404 as const };
    }

    const isAdmin = hasAdminPermission(user, "manage_appointments");
    const isAssignedDoctor =
      user.role === "doctor" && user.doctorId === appt.doctorId;
    const isOwnerPatient =
      user.role === "patient" &&
      (appt.patientId === user.id ||
        appt.patientEmail.toLowerCase() === user.email.toLowerCase());

    if (!isAdmin && !isAssignedDoctor && !isOwnerPatient) {
      return { error: "Forbidden", status: 403 as const };
    }

    const nowIso = new Date().toISOString();
    const doctor = db.doctors.find((d) => d.id === appt.doctorId)!;
    const service = db.services.find((s) => s.id === appt.serviceId)!;

    if (action === "update_notes") {
      if (!isAdmin && !isAssignedDoctor) {
        return { error: "Forbidden", status: 403 as const };
      }
      appt.notes = (notes ?? "").trim();
      appt.updatedAt = nowIso;
      return {
        appointment: appt,
        doctor,
        service,
        settings: db.websiteSettings,
        notifyEvent: null
      };
    }

    if (action === "cancel") {
      if (isOwnerPatient && !isAdmin) {
        const eligibility = evaluateCancellationEligibility({
          appointment: appt,
          rules: db.websiteSettings.bookingSettings
        });
        if (!eligibility.canCancel) {
          return {
            error: eligibility.reason || "Cancellation not permitted.",
            status: 400 as const
          };
        }
      }

      const previousStatus = appt.status;
      if (previousStatus === "cancelled") {
        return {
          error: "Appointment is already cancelled.",
          status: 400 as const
        };
      }

      appt.status = "cancelled";
      appt.cancellationReason = reason?.trim() || "Cancelled by user";
      appt.cancelledAt = nowIso;
      appt.cancelledBy = user.id;
      appt.updatedAt = nowIso;

      // Process refund if paid & eligible (admins can also trigger refund on cancel)
      const payment = db.payments.find(
        (p) => p.appointmentId === appt.id && p.status === "captured"
      );
      if (payment && payment.razorpayPaymentId) {
        const eligibility = evaluateCancellationEligibility({
          appointment: { ...appt, status: previousStatus },
          rules: db.websiteSettings.bookingSettings
        });
        if (isAdmin || eligibility.refundEligible) {
          const refund = await initiateRazorpayRefund({
            paymentId: payment.razorpayPaymentId,
            amountInr: payment.amount
          });
          payment.status = "refunded";
          payment.refundId = refund.refundId;
          payment.refundStatus = refund.status;
          payment.updatedAt = nowIso;
          appt.paymentStatus = "refunded";
        }
      }

      db.appointmentStatusHistory.push({
        id: generateId(),
        appointmentId: appt.id,
        previousStatus,
        newStatus: "cancelled",
        changedBy: user.id,
        changedByName: user.fullName,
        note: appt.cancellationReason,
        createdAt: nowIso
      });

      return {
        appointment: appt,
        doctor,
        service,
        settings: db.websiteSettings,
        notifyEvent: "appointment_cancelled" as const
      };
    }

    // action === "update_status"
    if (!isAdmin && !isAssignedDoctor) {
      return { error: "Forbidden", status: 403 as const };
    }
    if (!status) {
      return { error: "Target status is required.", status: 400 as const };
    }

    // Doctors can only update permitted clinical statuses
    const doctorAllowed: AppointmentStatus[] = [
      "confirmed",
      "completed",
      "no_show",
      "cancelled"
    ];
    if (isAssignedDoctor && !isAdmin && !doctorAllowed.includes(status)) {
      return {
        error: "Doctors cannot set that appointment status.",
        status: 403 as const
      };
    }

    const previousStatus = appt.status;
    appt.status = status;
    if (status === "cancelled") {
      appt.cancellationReason = reason?.trim() || "Cancelled by hospital staff";
      appt.cancelledAt = nowIso;
      appt.cancelledBy = user.id;
    }
    appt.updatedAt = nowIso;

    db.appointmentStatusHistory.push({
      id: generateId(),
      appointmentId: appt.id,
      previousStatus,
      newStatus: status,
      changedBy: user.id,
      changedByName: user.fullName,
      note: reason?.trim() || `Status updated to ${status}`,
      createdAt: nowIso
    });

    const notifyEvent =
      status === "confirmed"
        ? ("appointment_confirmed" as const)
        : status === "cancelled"
        ? ("appointment_cancelled" as const)
        : null;

    return {
      appointment: appt,
      doctor,
      service,
      settings: db.websiteSettings,
      notifyEvent
    };
  });

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  if (outcome.notifyEvent) {
    await dispatchBookingNotifications({
      event: outcome.notifyEvent,
      appointment: outcome.appointment,
      doctor: outcome.doctor,
      service: outcome.service,
      settings: outcome.settings
    });
  }

  return NextResponse.json({ appointment: outcome.appointment });
}
