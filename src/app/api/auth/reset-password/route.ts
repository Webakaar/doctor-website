import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import {
  verifyEmailOtpChallenge,
  verifySupabaseOtpChallengeToken
} from "@/lib/email-otp";
import {
  ensureSupabaseAuthUser,
  verifySupabaseEmailOtpCode
} from "@/lib/supabase-auth";

const resetSchema = z.object({
  email: z.string().email("Valid email address is required."),
  code: z
    .string()
    .regex(/^\d{6}$/, "Please enter the 6-digit OTP verification code."),
  otpToken: z
    .string()
    .min(10, "Verification session expired. Please request a new OTP code."),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters long.")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Valid email, 6-digit OTP, and new password (min 6 chars) are required."
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const isSupabaseToken = verifySupabaseOtpChallengeToken({
      token: parsed.data.otpToken,
      email
    });

    let verifiedSupabaseUserId: string | undefined;
    let isValid = false;

    if (isSupabaseToken) {
      const sbVerified = await verifySupabaseEmailOtpCode({
        email,
        code: parsed.data.code
      });
      if (sbVerified?.authUserId) {
        verifiedSupabaseUserId = sbVerified.authUserId;
        isValid = true;
      }
    } else {
      isValid = verifyEmailOtpChallenge({
        token: parsed.data.otpToken,
        email,
        code: parsed.data.code
      });
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired 6-digit OTP code." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    const profileCheck = await mutateDb((db) => {
      const profile = db.profiles.find((p) => p.email.toLowerCase() === email);
      if (!profile) {
        return { error: "Account not found." as const };
      }
      if (!profile.isActive) {
        return {
          error:
            "This account is currently inactive. Please contact hospital support." as const
        };
      }

      profile.passwordHash = newHash;
      if (verifiedSupabaseUserId && profile.authUserId !== verifiedSupabaseUserId) {
        profile.authUserId = verifiedSupabaseUserId;
      }
      profile.updatedAt = new Date().toISOString();

      return {
        success: true as const,
        fullName: profile.fullName,
        phone: profile.phone,
        role: profile.role,
        authUserId: profile.authUserId
      };
    });

    if ("error" in profileCheck) {
      return NextResponse.json({ error: profileCheck.error }, { status: 400 });
    }

    const syncedAuth = await ensureSupabaseAuthUser({
      email,
      password: parsed.data.newPassword,
      fullName: profileCheck.fullName,
      phone: profileCheck.phone,
      role: profileCheck.role,
      emailConfirm: true
    });

    if (syncedAuth?.authUserId && syncedAuth.authUserId !== profileCheck.authUserId) {
      await mutateDb((db) => {
        const profile = db.profiles.find((p) => p.email.toLowerCase() === email);
        if (profile) {
          profile.authUserId = syncedAuth.authUserId;
          profile.updatedAt = new Date().toISOString();
        }
      });
    }

    return NextResponse.json({ message: "Password updated successfully." });
  } catch {
    return NextResponse.json(
      { error: "Unable to reset password." },
      { status: 500 }
    );
  }
}
