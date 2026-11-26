import { describe, expect, it } from "vitest";
import {
  evaluateCancellationEligibility,
  findConflictingAppointmentsForBlock,
  findConflictingAppointmentsForScheduleChange,
  generateDoctorSlotsForDate
} from "@/lib/slots";
import {
  generateDemoPaymentSignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from "@/lib/razorpay";
import {
  hasAdminPermission,
  signSessionToken,
  verifySessionToken
} from "@/lib/auth";
import type {
  Appointment,
  BlockedSlot,
  BookingRulesConfig,
  Coupon,
  DoctorSchedule,
  PublicUser,
  Service
} from "@/types/hospital";
import { matchSymptomToDepartment } from "@/lib/symptom-triage";
import { evaluateCouponForBooking } from "@/lib/coupons";

const baseSchedule: DoctorSchedule = {
  id: "sched-1",
  doctorId: "doc-1",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "12:00",
  breakStart: "10:30",
  breakEnd: "11:00",
  slotDurationMins: 30,
  isAvailable: true
};

const baseAppointment: Appointment = {
  id: "appt-1",
  bookingRef: "AUR-2026-1001",
  patientName: "Test Patient",
  patientPhone: "+91 98200 11111",
  patientEmail: "test@example.com",
  reasonForVisit: "Checkup",
  doctorId: "doc-1",
  serviceId: "svc-1",
  appointmentDate: "2026-12-07", // Monday
  slotStart: "09:30",
  slotEnd: "10:00",
  consultationFee: 800,
  status: "confirmed",
  paymentStatus: "paid",
  notes: "",
  createdAt: "2026-11-26T10:00:00.000Z",
  updatedAt: "2026-11-26T10:00:00.000Z"
};

describe("Appointment slot generation & conflict prevention", () => {
  it("generates slots excluding breaks, blocked slots, and confirmed bookings", () => {
    const blocked: BlockedSlot[] = [
      {
        id: "blk-1",
        doctorId: "doc-1",
        blockedDate: "2026-12-07",
        startTime: "11:30",
        endTime: "12:00",
        isFullDay: false,
        reason: "Meeting",
        type: "blocked",
        createdAt: "2026-11-26T00:00:00Z"
      }
    ];

    const slots = generateDoctorSlotsForDate({
      doctorId: "doc-1",
      dateStr: "2026-12-07",
      schedules: [baseSchedule],
      blockedSlots: blocked,
      appointments: [baseAppointment],
      now: new Date("2026-12-06T08:00:00")
    });

    const byTime = Object.fromEntries(slots.map((s) => [s.startTime, s]));
    expect(byTime["09:00"].available).toBe(true);
    expect(byTime["09:30"].available).toBe(false);
    expect(byTime["09:30"].reason).toBe("booked");
    expect(byTime["10:00"].available).toBe(true);
    expect(byTime["10:30"].available).toBe(false);
    expect(byTime["10:30"].reason).toBe("break");
    expect(byTime["11:00"].available).toBe(true);
    expect(byTime["11:30"].available).toBe(false);
    expect(byTime["11:30"].reason).toBe("blocked");
  });

  it("blocks slots during active payment holds and releases expired holds", () => {
    const activeHold: Appointment = {
      ...baseAppointment,
      id: "appt-hold",
      status: "pending_payment",
      paymentStatus: "pending",
      holdExpiresAt: "2026-12-06T08:10:00.000Z"
    };
    const expiredHold: Appointment = {
      ...activeHold,
      id: "appt-expired",
      holdExpiresAt: "2026-12-06T07:50:00.000Z"
    };

    const now = new Date("2026-12-06T08:00:00.000Z");

    const duringHold = generateDoctorSlotsForDate({
      doctorId: "doc-1",
      dateStr: "2026-12-07",
      schedules: [baseSchedule],
      blockedSlots: [],
      appointments: [activeHold],
      now
    });
    expect(duringHold.find((s) => s.startTime === "09:30")?.available).toBe(
      false
    );
    expect(duringHold.find((s) => s.startTime === "09:30")?.reason).toBe(
      "held"
    );

    const afterExpiry = generateDoctorSlotsForDate({
      doctorId: "doc-1",
      dateStr: "2026-12-07",
      schedules: [baseSchedule],
      blockedSlots: [],
      appointments: [expiredHold],
      now
    });
    expect(afterExpiry.find((s) => s.startTime === "09:30")?.available).toBe(
      true
    );
  });

  it("warns when schedule changes or leave blocks conflict with confirmed appointments", () => {
    const schedConflicts = findConflictingAppointmentsForScheduleChange({
      doctorId: "doc-1",
      dayOfWeek: 1,
      newIsAvailable: true,
      newStartTime: "10:00",
      newEndTime: "14:00",
      appointments: [baseAppointment],
      now: new Date("2026-12-01T00:00:00Z")
    });
    expect(schedConflicts).toHaveLength(1);

    const blockConflicts = findConflictingAppointmentsForBlock({
      doctorId: "doc-1",
      blockedDate: "2026-12-07",
      isFullDay: true,
      appointments: [baseAppointment]
    });
    expect(blockConflicts).toHaveLength(1);
  });
});

describe("Cancellation policy & refund eligibility", () => {
  const rules: BookingRulesConfig = {
    bookingFlowOrder: "service_first",
    paymentMandatoryForConfirmation: true,
    requireManualApproval: false,
    slotHoldMinutes: 10,
    cancellationWindowHours: 4,
    refundEligibleWithinWindow: true,
    advanceBookingDays: 30
  };

  it("allows cancellation & refund outside the cutoff window", () => {
    const res = evaluateCancellationEligibility({
      appointment: baseAppointment,
      rules,
      now: new Date("2026-12-07T04:00:00")
    });
    expect(res.canCancel).toBe(true);
    expect(res.refundEligible).toBe(true);
  });

  it("denies cancellation inside the cutoff window", () => {
    const res = evaluateCancellationEligibility({
      appointment: baseAppointment,
      rules,
      now: new Date("2026-12-07T08:00:00")
    });
    expect(res.canCancel).toBe(false);
    expect(res.refundEligible).toBe(false);
  });
});

describe("Razorpay cryptographic verification & Auth RBAC", () => {
  it("verifies valid Razorpay payment & webhook signatures and rejects tampering", () => {
    const orderId = "order_test_123";
    const paymentId = "pay_test_456";
    const sig = generateDemoPaymentSignature(orderId, paymentId);

    expect(
      verifyRazorpayPaymentSignature({
        orderId,
        paymentId,
        signature: sig
      })
    ).toBe(true);

    expect(
      verifyRazorpayPaymentSignature({
        orderId,
        paymentId,
        signature: "0".repeat(sig.length)
      })
    ).toBe(false);

    expect(verifyRazorpayWebhookSignature('{"event":"test"}', "invalid")).toBe(
      false
    );
  });

  it("signs & verifies session tokens and enforces role permissions", () => {
    const token = signSessionToken("user-1", "staff");
    const verified = verifySessionToken(token);
    expect(verified?.userId).toBe("user-1");
    expect(verified?.role).toBe("staff");

    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken(tampered)).toBeNull();

    const staffUser: PublicUser = {
      id: "u1",
      email: "staff@example.com",
      fullName: "Staff",
      phone: "",
      role: "staff",
      permissions: { manage_appointments: true, manage_doctors: false },
      isActive: true,
      createdAt: "",
      updatedAt: ""
    };
    expect(hasAdminPermission(staffUser, "manage_appointments")).toBe(true);
    expect(hasAdminPermission(staffUser, "manage_doctors")).toBe(false);
  });
});

describe("AI symptom-to-department triage matching", () => {
  const services: Service[] = [
    {
      id: "s-cardio",
      slug: "cardiology",
      name: "Cardiology & Heart Care",
      category: "Cardiac Sciences",
      shortDescription: "Heart care and blood pressure",
      fullDescription: "",
      iconName: "HeartPulse",
      imageUrl: "",
      isPublished: true,
      displayOrder: 1,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "s-ortho",
      slug: "orthopedics",
      name: "Orthopedics & Joint Care",
      category: "Musculoskeletal",
      shortDescription: "Bone, joint and spine care",
      fullDescription: "",
      iconName: "Bone",
      imageUrl: "",
      isPublished: true,
      displayOrder: 2,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "s-neuro",
      slug: "neurology",
      name: "Neurology & Brain Care",
      category: "Neurosciences",
      shortDescription: "Migraine and nerve disorders",
      fullDescription: "",
      iconName: "Brain",
      imageUrl: "",
      isPublished: true,
      displayOrder: 3,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "s-derm",
      slug: "dermatology",
      name: "Dermatology & Skin Care",
      category: "Clinical Dermatology",
      shortDescription: "Acne, eczema, and hair care",
      fullDescription: "",
      iconName: "Sparkles",
      imageUrl: "",
      isPublished: true,
      displayOrder: 4,
      createdAt: "",
      updatedAt: ""
    }
  ];

  it("matches symptoms to the right hospital department and flags urgent symptoms", () => {
    expect(
      matchSymptomToDepartment("I have knee pain and back stiffness", services, [])
        ?.service.slug
    ).toBe("orthopedics");

    expect(
      matchSymptomToDepartment("Suffering from severe migraine and dizziness", services, [])
        ?.service.slug
    ).toBe("neurology");

    expect(
      matchSymptomToDepartment("Skin rash and hair fall for 2 weeks", services, [])
        ?.service.slug
    ).toBe("dermatology");

    const emergencyRes = matchSymptomToDepartment(
      "Having severe chest pain and shortness of breath",
      services,
      []
    );
    expect(emergencyRes?.service.slug).toBe("cardiology");
    expect(emergencyRes?.isEmergency).toBe(true);
  });
});

describe("Promo coupon evaluation & discounts", () => {
  const sampleCoupons: Coupon[] = [
    {
      id: "c-flat",
      code: "FLAT200",
      description: "Flat 200 off",
      discountType: "flat",
      discountValue: 200,
      minFeeAmount: 500,
      usedCount: 0,
      isActive: true,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "c-pct",
      code: "CARE20",
      description: "20% off up to 150",
      discountType: "percent",
      discountValue: 20,
      maxDiscountAmount: 150,
      minFeeAmount: 400,
      usageLimit: 5,
      usedCount: 2,
      validFrom: "2026-01-01T00:00:00.000Z",
      validUntil: "2026-12-31T23:59:59.000Z",
      isActive: true,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "c-full",
      code: "FREE100",
      description: "100% off",
      discountType: "percent",
      discountValue: 100,
      minFeeAmount: 0,
      usedCount: 0,
      isActive: true,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "c-inactive",
      code: "PAUSED",
      description: "Inactive coupon",
      discountType: "flat",
      discountValue: 100,
      minFeeAmount: 0,
      usedCount: 0,
      isActive: false,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "c-maxed",
      code: "LIMIT5",
      description: "Usage limit reached",
      discountType: "flat",
      discountValue: 100,
      minFeeAmount: 0,
      usageLimit: 5,
      usedCount: 5,
      isActive: true,
      createdAt: "",
      updatedAt: ""
    }
  ];

  const now = new Date("2026-06-15T12:00:00.000Z");

  it("applies flat and capped percentage discounts case-insensitively", () => {
    const flatRes = evaluateCouponForBooking({
      code: " flat200 ",
      feeAmount: 800,
      coupons: sampleCoupons,
      now
    });
    expect(flatRes.valid).toBe(true);
    expect(flatRes.couponCode).toBe("FLAT200");
    expect(flatRes.discountAmount).toBe(200);
    expect(flatRes.finalFee).toBe(600);

    const pctRes = evaluateCouponForBooking({
      code: "care20",
      feeAmount: 1000,
      coupons: sampleCoupons,
      now
    });
    expect(pctRes.valid).toBe(true);
    expect(pctRes.discountAmount).toBe(150);
    expect(pctRes.finalFee).toBe(850);

    const freeRes = evaluateCouponForBooking({
      code: "FREE100",
      feeAmount: 750,
      coupons: sampleCoupons,
      now
    });
    expect(freeRes.valid).toBe(true);
    expect(freeRes.discountAmount).toBe(750);
    expect(freeRes.finalFee).toBe(0);
  });

  it("rejects inactive, expired, maxed-out, or below-minimum-fee coupons", () => {
    expect(
      evaluateCouponForBooking({
        code: "PAUSED",
        feeAmount: 800,
        coupons: sampleCoupons,
        now
      }).valid
    ).toBe(false);

    expect(
      evaluateCouponForBooking({
        code: "LIMIT5",
        feeAmount: 800,
        coupons: sampleCoupons,
        now
      }).valid
    ).toBe(false);

    expect(
      evaluateCouponForBooking({
        code: "CARE20",
        feeAmount: 1000,
        coupons: sampleCoupons,
        now: new Date("2027-01-02T00:00:00.000Z")
      }).valid
    ).toBe(false);

    expect(
      evaluateCouponForBooking({
        code: "FLAT200",
        feeAmount: 300,
        coupons: sampleCoupons,
        now
      }).valid
    ).toBe(false);
  });
});
