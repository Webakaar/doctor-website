import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb } from "@/lib/db";
import { evaluateCouponForBooking } from "@/lib/coupons";

const validateSchema = z.object({
  code: z.string().min(1),
  doctorId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Coupon code and doctor are required." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const doctor = db.doctors.find(
      (d) => d.id === parsed.data.doctorId && d.isActive && d.isVisible
    );
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    const evalRes = evaluateCouponForBooking({
      code: parsed.data.code,
      feeAmount: doctor.consultationFee,
      coupons: db.coupons
    });

    if (!evalRes.valid) {
      return NextResponse.json({ error: evalRes.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      couponCode: evalRes.couponCode,
      description: evalRes.coupon?.description || "",
      discountType: evalRes.coupon?.discountType,
      discountValue: evalRes.coupon?.discountValue,
      originalFee: evalRes.originalFee,
      discountAmount: evalRes.discountAmount,
      finalFee: evalRes.finalFee
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to validate coupon." },
      { status: 500 }
    );
  }
}
