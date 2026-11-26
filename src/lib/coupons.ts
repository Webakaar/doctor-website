import type { Coupon } from "@/types/hospital";

export interface CouponEvaluationResult {
  valid: boolean;
  coupon?: Coupon;
  couponCode: string;
  originalFee: number;
  discountAmount: number;
  finalFee: number;
  error?: string;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function evaluateCouponForBooking(params: {
  code: string;
  feeAmount: number;
  coupons: Coupon[];
  now?: Date;
}): CouponEvaluationResult {
  const normalized = normalizeCouponCode(params.code);
  const originalFee = Math.max(0, Number(params.feeAmount) || 0);
  const now = params.now ?? new Date();

  if (!normalized) {
    return {
      valid: false,
      couponCode: "",
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "Please enter a coupon code."
    };
  }

  const coupon = params.coupons.find(
    (c) => c.code.toUpperCase() === normalized
  );

  if (!coupon) {
    return {
      valid: false,
      couponCode: normalized,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "Invalid coupon code."
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      couponCode: coupon.code,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "This coupon is currently inactive."
    };
  }

  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now.getTime()) {
    return {
      valid: false,
      couponCode: coupon.code,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "This coupon is not active yet."
    };
  }

  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now.getTime()) {
    return {
      valid: false,
      couponCode: coupon.code,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "This coupon has expired."
    };
  }

  if (
    coupon.usageLimit !== undefined &&
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      couponCode: coupon.code,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: "This coupon has reached its maximum usage limit."
    };
  }

  if (originalFee < coupon.minFeeAmount) {
    return {
      valid: false,
      couponCode: coupon.code,
      originalFee,
      discountAmount: 0,
      finalFee: originalFee,
      error: `Minimum consultation fee of ₹${coupon.minFeeAmount} is required for this coupon.`
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "flat") {
    discountAmount = Math.min(coupon.discountValue, originalFee);
  } else {
    discountAmount = Math.round((originalFee * coupon.discountValue) / 100);
    if (
      coupon.maxDiscountAmount !== undefined &&
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount > 0
    ) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
    discountAmount = Math.min(discountAmount, originalFee);
  }

  const finalFee = Math.max(0, originalFee - discountAmount);

  return {
    valid: true,
    coupon,
    couponCode: coupon.code,
    originalFee,
    discountAmount,
    finalFee
  };
}
