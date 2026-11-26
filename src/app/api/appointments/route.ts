import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateBookingRef, generateId, mutateDb, readDb } from "@/lib/db";
import { dispatchBookingNotifications } from "@/lib/notifications";
import { createRazorpayOrder, getRazorpayPublicKeyId } from "@/lib/razorpay";
import { generateDoctorSlotsForDate } from "@/lib/slots";
import { evaluateCouponForBooking } from "@/lib/coupons";
import type { Appointment, PaymentRecord } from "@/types/hospital";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  const db = await readDb();

  let list = db.appointments;

  if (scope === "admin" && hasAdminPermission(user, "manage_appointments")) {
    // all appointments
  } else if (scope === "doctor" && user.role === "doctor" && user.doctorId) {
    list = list.filter((a) => a.doctorId === user.doctorId);
  } else if (user.role === "patient") {
    list = list.filter(
      (a) =>
        a.patientId === user.id ||
        a.patientEmail.toLowerCase() === user.email.toLowerCase()
    );
  } else if (hasAdminPermission(user, "manage_appointments")) {
    // admin default
  } else if (user.role === "doctor" && user.doctorId) {
    list = list.filter((a) => a.doctorId === user.doctorId);
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enriched = list
    .map((appt) => {
      const doctor = db.doctors.find((d) => d.id === appt.doctorId);
      const service = db.services.find((s) => s.id === appt.serviceId);
      const payment = db.payments.find((p) => p.appointmentId === appt.id);
      return {
        ...appt,
        doctorName: doctor?.fullName || "Unknown Doctor",
        doctorSpecialty: doctor?.specialty || "",
        serviceName: service?.name || "General Consultation",
        payment
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ appointments: enriched });
}

const createBookingSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotStart: z.string().regex(/^\d{2}:\d{2}$/),
  patientName: z.string().min(2, "Patient full name is required"),
  patientPhone: z.string().min(7, "Valid mobile number is required"),
  patientEmail: z.string().email("Valid email address is required"),
  reasonForVisit: z.string().max(500).optional().default(""),
  couponCode: z.string().max(32).optional().default(""),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Please accept the booking terms & privacy policy."
  })
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid booking request." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const data = parsed.data;

    // Atomic slot check + booking hold creation inside database mutex
    const bookingResult = await mutateDb((db) => {
      const doctor = db.doctors.find(
        (d) => d.id === data.doctorId && d.isActive && d.isVisible
      );
      if (!doctor) {
        return { error: "Selected doctor is not available.", status: 404 as const };
      }

      const service = db.services.find(
        (s) => s.id === data.serviceId && s.isPublished
      );
      if (!service) {
        return { error: "Selected service is not available.", status: 404 as const };
      }

      const availableSlots = generateDoctorSlotsForDate({
        doctorId: doctor.id,
        dateStr: data.appointmentDate,
        schedules: db.doctorSchedules,
        blockedSlots: db.blockedSlots,
        appointments: db.appointments,
        fallbackDurationMins: doctor.slotDurationMins
      });

      const targetSlot = availableSlots.find(
        (s) => s.startTime === data.slotStart
      );
      if (!targetSlot || !targetSlot.available) {
        return {
          error:
            "This time slot was just reserved or is no longer available. Please choose another slot.",
          status: 409 as const
        };
      }

      const rules = db.websiteSettings.bookingSettings;
      const now = new Date();
      const nowIso = now.toISOString();
      const bookingRef = generateBookingRef(db.appointments.length);
      const appointmentId = generateId();

      const linkedPatient =
        currentUser?.role === "patient"
          ? currentUser.id
          : db.profiles.find(
              (p) =>
                p.role === "patient" &&
                p.email.toLowerCase() === data.patientEmail.trim().toLowerCase()
            )?.id;

      const originalFee = doctor.consultationFee;
      let discountAmount = 0;
      let appliedCouponCode: string | undefined;
      let finalFee = originalFee;

      if (data.couponCode && data.couponCode.trim()) {
        const couponEval = evaluateCouponForBooking({
          code: data.couponCode,
          feeAmount: originalFee,
          coupons: db.coupons,
          now
        });
        if (!couponEval.valid || !couponEval.coupon) {
          return {
            error: couponEval.error || "Invalid coupon code.",
            status: 400 as const
          };
        }
        discountAmount = couponEval.discountAmount;
        finalFee = couponEval.finalFee;
        appliedCouponCode = couponEval.coupon.code;
        couponEval.coupon.usedCount += 1;
        couponEval.coupon.updatedAt = nowIso;
      }

      const requiresPayment =
        rules.paymentMandatoryForConfirmation && finalFee > 0;
      const initialStatus = requiresPayment
        ? "pending_payment"
        : rules.requireManualApproval
        ? "pending_confirmation"
        : "confirmed";

      const holdExpiresAt = requiresPayment
        ? new Date(
            now.getTime() + (rules.slotHoldMinutes || 10) * 60 * 1000
          ).toISOString()
        : undefined;

      const appointment: Appointment = {
        id: appointmentId,
        bookingRef,
        patientId: linkedPatient,
        patientName: data.patientName.trim(),
        patientPhone: data.patientPhone.trim(),
        patientEmail: data.patientEmail.trim().toLowerCase(),
        reasonForVisit: data.reasonForVisit.trim(),
        doctorId: doctor.id,
        serviceId: service.id,
        appointmentDate: data.appointmentDate,
        slotStart: targetSlot.startTime,
        slotEnd: targetSlot.endTime,
        originalFee,
        couponCode: appliedCouponCode,
        discountAmount,
        consultationFee: finalFee,
        status: initialStatus,
        paymentStatus: finalFee === 0 ? "paid" : "pending",
        holdExpiresAt,
        notes: "",
        createdAt: nowIso,
        updatedAt: nowIso
      };

      db.appointments.push(appointment);
      db.appointmentStatusHistory.push({
        id: generateId(),
        appointmentId,
        newStatus: initialStatus,
        changedBy: currentUser?.id,
        changedByName: currentUser?.fullName || data.patientName.trim(),
        note: requiresPayment
          ? `Slot held for ${rules.slotHoldMinutes} minutes pending Razorpay payment.`
          : "Appointment created without upfront payment.",
        createdAt: nowIso
      });

      return {
        appointment,
        doctor,
        service,
        settings: db.websiteSettings,
        requiresPayment
      };
    });

    if ("error" in bookingResult) {
      return NextResponse.json(
        { error: bookingResult.error },
        { status: bookingResult.status }
      );
    }

    const { appointment, doctor, service, settings, requiresPayment } =
      bookingResult;

    let razorpayOrder: {
      orderId: string;
      amountPaise: number;
      currency: string;
      mode: "live" | "demo";
      keyId: string;
    } | null = null;

    if (requiresPayment) {
      const order = await createRazorpayOrder({
        amountInr: appointment.consultationFee,
        bookingRef: appointment.bookingRef,
        appointmentId: appointment.id
      });

      await mutateDb((db) => {
        const paymentRecord: PaymentRecord = {
          id: generateId(),
          appointmentId: appointment.id,
          bookingRef: appointment.bookingRef,
          razorpayOrderId: order.orderId,
          amount: appointment.consultationFee,
          currency: order.currency,
          status: "created",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.payments.push(paymentRecord);
      });

      razorpayOrder = {
        ...order,
        keyId: getRazorpayPublicKeyId()
      };
    }

    await dispatchBookingNotifications({
      event: "booking_received",
      appointment,
      doctor,
      service,
      settings
    });

    if (appointment.status === "confirmed") {
      await dispatchBookingNotifications({
        event: "appointment_confirmed",
        appointment,
        doctor,
        service,
        settings
      });
    }

    return NextResponse.json(
      {
        appointment,
        doctorName: doctor.fullName,
        serviceName: service.name,
        requiresPayment,
        razorpayOrder
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create appointment booking." },
      { status: 500 }
    );
  }
}
