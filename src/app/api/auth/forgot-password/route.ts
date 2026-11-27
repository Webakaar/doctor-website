import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb } from "@/lib/db";
import { sendEmailNotification } from "@/lib/notifications";
import {
  generateSixDigitOtp,
  signEmailOtpChallenge,
  signSupabaseOtpChallenge
} from "@/lib/email-otp";
import { generateSupabaseEmailOtp } from "@/lib/supabase-auth";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address.")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const db = await readDb();
    const settings = db.websiteSettings;
    const profile = db.profiles.find((p) => p.email.toLowerCase() === email);

    if (!profile) {
      return NextResponse.json(
        { error: "No account found with that email address." },
        { status: 404 }
      );
    }

    if (!profile.isActive) {
      return NextResponse.json(
        { error: "This account is currently inactive. Please contact hospital support." },
        { status: 403 }
      );
    }

    const supabaseOtp = await generateSupabaseEmailOtp({
      email,
      fullName: profile.fullName,
      role: profile.role
    });

    const otpCode = supabaseOtp?.otpCode || generateSixDigitOtp();
    const otpToken = supabaseOtp
      ? signSupabaseOtpChallenge({ email })
      : signEmailOtpChallenge({ email, code: otpCode });

    const emailResult = await sendEmailNotification({
      to: email,
      subject: `Password Reset Code (${otpCode}) - ${settings.hospitalName}`,
      text: [
        `Hello ${profile.fullName},`,
        "",
        `Your 6-digit password reset OTP code is: ${otpCode}`,
        "",
        "Enter this code on the Reset Password tab along with your new password.",
        "",
        `${settings.hospitalName}`
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; color: #0f172a;">
          <div style="background: #06213e; color: #ffffff; padding: 20px 24px;">
            <p style="margin: 0; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">${settings.hospitalName}</p>
            <h2 style="margin: 6px 0 0; font-size: 19px;">Password Reset OTP</h2>
          </div>
          <div style="padding: 24px; background: #ffffff;">
            <p style="margin-top: 0; font-size: 14px;">Hello <strong>${profile.fullName}</strong>,</p>
            <p style="font-size: 14px; color: #334155;">Use the 6-digit verification code below to reset your portal password:</p>
            <div style="margin: 20px 0; padding: 16px; text-align: center; background: #f4f9ff; border: 1px dashed #0b71c7; border-radius: 12px;">
              <span style="font-family: monospace; font-size: 30px; font-weight: 900; letter-spacing: 8px; color: #06213e;">${otpCode}</span>
            </div>
            <p style="margin-bottom: 0; font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      `,
      config: {
        ...settings.notificationSettings,
        emailEnabled: true
      }
    });

    if (emailResult.status === "failed") {
      return NextResponse.json(
        {
          error:
            emailResult.errorMessage ||
            "Unable to send password reset OTP email."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sent: true,
      email,
      otpToken,
      message: `6-digit reset OTP sent to ${email}. Check your inbox.`,
      ...(emailResult.status === "simulated" ? { demoOtp: otpCode } : {})
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to send password reset OTP right now." },
      { status: 500 }
    );
  }
}
