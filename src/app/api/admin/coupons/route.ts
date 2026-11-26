import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import { normalizeCouponCode } from "@/lib/coupons";
import type { Coupon } from "@/types/hospital";

function canManageCoupons(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return (
    hasAdminPermission(user, "manage_payments") ||
    hasAdminPermission(user, "manage_website")
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!canManageCoupons(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const coupons = db.coupons
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ coupons });
}

const couponSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(32, "Code too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, - and _"),
  description: z.string().max(200).optional().default(""),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  maxDiscountAmount: z.number().positive().nullable().optional(),
  minFeeAmount: z.number().min(0).default(0),
  usageLimit: z.number().int().positive().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!canManageCoupons(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid coupon data." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.discountType === "percent" && data.discountValue > 100) {
    return NextResponse.json(
      { error: "Percentage discount cannot exceed 100%." },
      { status: 400 }
    );
  }

  const normalizedCode = normalizeCouponCode(data.code);

  const result = await mutateDb((db) => {
    if (db.coupons.some((c) => c.code.toUpperCase() === normalizedCode)) {
      return { error: "A coupon with this code already exists." as const };
    }

    const now = new Date().toISOString();
    const coupon: Coupon = {
      id: generateId(),
      code: normalizedCode,
      description: data.description.trim(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscountAmount: data.maxDiscountAmount ?? undefined,
      minFeeAmount: data.minFeeAmount,
      usageLimit: data.usageLimit ?? undefined,
      usedCount: 0,
      validFrom: data.validFrom || undefined,
      validUntil: data.validUntil || undefined,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now
    };
    db.coupons.unshift(coupon);
    return { coupon };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ coupon: result.coupon }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!canManageCoupons(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      { error: parsed.error?.issues[0]?.message || "Coupon ID and valid fields are required." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const normalizedCode = normalizeCouponCode(data.code);

  const result = await mutateDb((db) => {
    const coupon = db.coupons.find((c) => c.id === data.id);
    if (!coupon) return { error: "Coupon not found." as const, status: 404 as const };

    if (
      db.coupons.some(
        (c) => c.id !== coupon.id && c.code.toUpperCase() === normalizedCode
      )
    ) {
      return {
        error: "Another coupon already uses this code." as const,
        status: 409 as const
      };
    }

    coupon.code = normalizedCode;
    coupon.description = data.description.trim();
    coupon.discountType = data.discountType;
    coupon.discountValue = data.discountValue;
    coupon.maxDiscountAmount = data.maxDiscountAmount ?? undefined;
    coupon.minFeeAmount = data.minFeeAmount;
    coupon.usageLimit = data.usageLimit ?? undefined;
    coupon.validFrom = data.validFrom || undefined;
    coupon.validUntil = data.validUntil || undefined;
    coupon.isActive = data.isActive;
    coupon.updatedAt = new Date().toISOString();

    return { coupon };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ coupon: result.coupon });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!canManageCoupons(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Coupon id required." }, { status: 400 });
  }

  await mutateDb((db) => {
    db.coupons = db.coupons.filter((c) => c.id !== id);
  });

  return NextResponse.json({ success: true });
}
