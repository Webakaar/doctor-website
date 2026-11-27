import { describe, expect, it } from "vitest";
import {
  assignNextQueueNumber,
  evaluateCancellationEligibility,
  findConflictingAppointmentsForBlock,
  findConflictingAppointmentsForScheduleChange,
  generateDoctorQueueWindowsForDate
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
import { buildReceiptHtml } from "@/lib/receipt";
import {
  generateSixDigitOtp,
  signEmailOtpChallenge,
  signSupabaseOtpChallenge,
  verifyEmailOtpChallenge,
  verifySupabaseOtpChallengeToken
} from "@/lib/email-otp";

const baseSchedule: DoctorSchedule = {
  id: "sched-1",
  doctorId: "doc-1",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "16:30",
  breakStart: "12:00",
  breakEnd: "13:30",
  slotDurationMins: 15,
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
  session: "morning",
  queueNumber: 1,
  slotStart: "09:00",
  slotEnd: "12:00",
  consultationFee: 800,
  status: "confirmed",
  paymentStatus: "paid",
  notes: "",
  createdAt: "2026-11-26T10:00:00.000Z",
  updatedAt: "2026-11-26T10:00:00.000Z"
};

describe("Queue window capacity, buffer & conflict prevention", () => {
  it("computes Morning & Evening windows using 15-min per patient estimation and configurable buffer", () => {
    // Morning: 09:00-12:00 = 180 mins; with 15 min buffer -> floor(165/15) = 11 capacity
    // Evening: 13:30-16:30 = 180 mins; subtract 30m blocked -> 150 mins - 15 buffer -> floor(135/15) = 9 capacity
    const blocked: BlockedSlot[] = [
      {
        id: "blk-1",
        doctorId: "doc-1",
        blockedDate: "2026-12-07",
        startTime: "16:00",
        endTime: "16:30",
        isFullDay: false,
        reason: "Rounds",
        type: "blocked",
        createdAt: "2026-11-26T00:00:00Z"
      }
    ];

    const windows = generateDoctorQueueWindowsForDate({
      doctorId: "doc-1",
      dateStr: "2026-12-07",
      schedules: [baseSchedule],
      blockedSlots: blocked,
      appointments: [baseAppointment],
      bookingRules: { queueMinutesPerPatient: 15, queueBufferMinutes: 15 },
      now: new Date("2026-12-06T08:00:00")
    });

    expect(windows).toHaveLength(2);
    const [morning, evening] = windows;
    expect(morning.session).toBe("morning");
    expect(morning.maxCapacity).toBe(11);
    expect(morning.bookedCount).toBe(1);
    expect(morning.spotsRemaining).toBe(10);
    expect(morning.nextQueueNumber).toBe(2);
    expect(morning.available).toBe(true);

    expect(evening.session).toBe("evening");
    expect(evening.maxCapacity).toBe(9);
    expect(evening.bookedCount).toBe(0);
    expect(evening.spotsRemaining).toBe(9);
  });

  it("stops accepting bookings when queue reaches max capacity and releases expired holds", () => {
    const narrowSchedule: DoctorSchedule = {
      ...baseSchedule,
      startTime: "09:00",
      endTime: "09:45",
      breakStart: undefined,
      breakEnd: undefined
    };
    // 45 mins - 15 min buffer = 30 mins -> maxCapacity = 2
    const now = new Date("2026-12-06T08:00:00.000Z");
    const activeHold: Appointment = {
      ...baseAppointment,
      id: "appt-hold",
      queueNumber: undefined,
      status: "pending_payment",
      paymentStatus: "pending",
      holdExpiresAt: "2026-12-06T08:10:00.000Z"
    };
    const expiredHold: Appointment = {
      ...activeHold,
      id: "appt-expired",
      holdExpiresAt: "2026-12-06T07:50:00.000Z"
    };

    const fullWindows = generateDoctorQueueWindowsForDate({
      doctorId: "doc-1",
      dateStr: "2026-12-07",
      schedules: [narrowSchedule],
      blockedSlots: [],
      appointments: [baseAppointment, activeHold, expiredHold],
      bookingRules: { queueMinutesPerPatient: 15, queueBufferMinutes: 15 },
      now
    });

    expect(fullWindows[0].maxCapacity).toBe(2);
    expect(fullWindows[0].bookedCount).toBe(2);
    expect(fullWindows[0].spotsRemaining).toBe(0);
    expect(fullWindows[0].available).toBe(false);
    expect(fullWindows[0].reason).toBe("full");
  });

  it("assigns sequential unique queue numbers per doctor, date, and session", () => {
    const nextToken = assignNextQueueNumber({
      doctorId: "doc-1",
      appointmentDate: "2026-12-07",
      session: "morning",
      appointments: [
        baseAppointment,
        { ...baseAppointment, id: "appt-2", queueNumber: 2, status: "confirmed" },
        { ...baseAppointment, id: "appt-3", queueNumber: 5, status: "cancelled" }
      ]
    });
    expect(nextToken).toBe(3);
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
    queueMinutesPerPatient: 15,
    queueBufferMinutes: 15,
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

describe("Branded appointment receipt HTML builder", () => {
  it("renders hospital letterhead, coupon breakdown, and escapes HTML input", () => {
    const html = buildReceiptHtml({
      hospitalName: "BookMyDoc India",
      hospitalPhone: "+91 22 4890 9911",
      hospitalEmail: "info@bookmydocindia.com",
      doctorName: "Dr. Arjun Mehta",
      serviceName: "Cardiology & Heart Care",
      paymentId: "pay_test_123",
      appointment: {
        id: "appt-r1",
        bookingRef: "AUR-2026-TEST99",
        patientName: "Dheeraj <script>alert(1)</script>",
        patientPhone: "8178491283",
        patientEmail: "patient@example.com",
        reasonForVisit: "Routine checkup",
        doctorId: "doc-1",
        serviceId: "svc-1",
        appointmentDate: "2026-11-28",
        slotStart: "10:00",
        slotEnd: "10:20",
        originalFee: 900,
        couponCode: "HEALTH100",
        discountAmount: 900,
        consultationFee: 0,
        status: "confirmed",
        paymentStatus: "paid",
        notes: "",
        createdAt: "2026-11-26T18:00:00.000Z",
        updatedAt: "2026-11-26T18:00:00.000Z"
      }
    });

    expect(html).toContain("BookMyDoc India");
    expect(html).toContain("AUR-2026-TEST99");
    expect(html).toContain("HEALTH100");
    expect(html).toContain("- ₹900");
    expect(html).toContain("₹0");
    expect(html).toContain("pay_test_123");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("6-digit email OTP verification", () => {
  it("generates a 6-digit numeric OTP and verifies matching vs tampered/expired challenges", () => {
    const code = generateSixDigitOtp();
    expect(code).toMatch(/^\d{6}$/);

    const token = signEmailOtpChallenge({
      email: "Patient@Example.com",
      code,
      ttlMs: 60_000
    });

    expect(
      verifyEmailOtpChallenge({
        token,
        email: "patient@example.com",
        code
      })
    ).toBe(true);

    expect(
      verifyEmailOtpChallenge({
        token,
        email: "patient@example.com",
        code: code === "123456" ? "654321" : "123456"
      })
    ).toBe(false);

    expect(
      verifyEmailOtpChallenge({
        token,
        email: "other@example.com",
        code
      })
    ).toBe(false);

    const expiredToken = signEmailOtpChallenge({
      email: "patient@example.com",
      code,
      ttlMs: -1000
    });
    expect(
      verifyEmailOtpChallenge({
        token: expiredToken,
        email: "patient@example.com",
        code
      })
    ).toBe(false);
  });

  it("signs and validates Supabase OTP challenge tokens scoped to email and expiry", () => {
    const sbToken = signSupabaseOtpChallenge({
      email: "User@Example.com",
      ttlMs: 60_000
    });
    expect(
      verifySupabaseOtpChallengeToken({
        token: sbToken,
        email: "user@example.com"
      })
    ).toBe(true);
    expect(
      verifySupabaseOtpChallengeToken({
        token: sbToken,
        email: "other@example.com"
      })
    ).toBe(false);

    const expiredSbToken = signSupabaseOtpChallenge({
      email: "user@example.com",
      ttlMs: -1000
    });
    expect(
      verifySupabaseOtpChallengeToken({
        token: expiredSbToken,
        email: "user@example.com"
      })
    ).toBe(false);
  });
});
