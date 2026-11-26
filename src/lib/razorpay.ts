import crypto from "node:crypto";
import Razorpay from "razorpay";

export function isRazorpayLiveConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

export function getRazorpayPublicKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_auracare_demo";
}

function getSignatureSecret(): string {
  return (
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.AUTH_SECRET ||
    "auracare-demo-razorpay-secret"
  );
}

export async function createRazorpayOrder(params: {
  amountInr: number;
  bookingRef: string;
  appointmentId: string;
}): Promise<{
  orderId: string;
  amountPaise: number;
  currency: string;
  mode: "live" | "demo";
}> {
  const amountPaise = Math.round(params.amountInr * 100);

  if (isRazorpayLiveConfigured()) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    const order = await instance.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: params.bookingRef,
      notes: {
        appointmentId: params.appointmentId,
        bookingRef: params.bookingRef
      }
    });
    return {
      orderId: order.id,
      amountPaise: Number(order.amount),
      currency: order.currency,
      mode: "live"
    };
  }

  return {
    orderId: `order_demo_${crypto.randomBytes(6).toString("hex")}`,
    amountPaise,
    currency: "INR",
    mode: "demo"
  };
}

export function generateDemoPaymentSignature(
  orderId: string,
  paymentId: string
): string {
  return crypto
    .createHmac("sha256", getSignatureSecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", getSignatureSecret())
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const sigBuf = Buffer.from(params.signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  headerSignature: string
): boolean {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET || getSignatureSecret();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const sigBuf = Buffer.from(headerSignature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function initiateRazorpayRefund(params: {
  paymentId: string;
  amountInr: number;
}): Promise<{ refundId: string; status: string }> {
  if (isRazorpayLiveConfigured() && !params.paymentId.startsWith("pay_demo_")) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    const refund = await instance.payments.refund(params.paymentId, {
      amount: Math.round(params.amountInr * 100)
    });
    return {
      refundId: refund.id,
      status: refund.status || "processed"
    };
  }

  return {
    refundId: `rfnd_demo_${crypto.randomBytes(5).toString("hex")}`,
    status: "processed"
  };
}
