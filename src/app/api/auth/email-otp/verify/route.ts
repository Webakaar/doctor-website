import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  getCurrentUser,
  hashPassword,
  signSessionToken,
  toPublicUser
} from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import {
  signVerifiedEmailProof,
  verifyEmailOtpChallenge,
  verifySupabaseOtpChallengeToken
} from "@/lib/email-otp";
import {
  ensureSupabaseAuthUser,
  verifySupabaseEmailOtpCode
} from "@/lib/supabase-auth";
import type { UserProfile } from "@/types/hospital";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Please enter the 6-digit verification code."),
  otpToken: z.string().min(10, "Verification session expired. Request a new code."),
  patientName: z.string().max(120).optional().default(""),
  patientPhone: z.string().max(40).optional().default(""),
  intent: z.enum(["booking_verify", "login"]).optional().default("booking_verify")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid verification input." },
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
        { error: "Invalid or expired 6-digit verification code." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const existingDb = await readDb();
    const existingProfile = existingDb.profiles.find(
      (p) => p.email.toLowerCase() === email
    );

    if (existingProfile && !existingProfile.isActive) {
      return NextResponse.json(
        { error: "This account is currently inactive. Please contact hospital support." },
        { status: 403 }
      );
    }

    const fallbackPassword = crypto.randomBytes(12).toString("hex");
    const passwordHash = await hashPassword(fallbackPassword);
    const cleanName = parsed.data.patientName.trim();
    const cleanPhone = parsed.data.patientPhone.trim();
    const effectiveRole = existingProfile?.role || "patient";

    const supabaseAuth = await ensureSupabaseAuthUser({
      email,
      fullName: cleanName || existingProfile?.fullName || email.split("@")[0],
      phone: cleanPhone || existingProfile?.phone || "",
      role: effectiveRole,
      emailConfirm: true
    });
    const resolvedAuthUserId = verifiedSupabaseUserId || supabaseAuth?.authUserId;

    const registration = await mutateDb((db) => {
      const nowIso = new Date().toISOString();
      let profile = db.profiles.find((p) => p.email.toLowerCase() === email);
      let isNewRegistration = false;

      if (!profile) {
        profile = {
          id: generateId(),
          authUserId: resolvedAuthUserId,
          email,
          fullName: cleanName || email.split("@")[0],
          phone: cleanPhone,
          role: "patient",
          permissions: {},
          passwordHash,
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso
        } as UserProfile;
        db.profiles.push(profile);
        isNewRegistration = true;
      } else {
        let updated = false;
        if (resolvedAuthUserId && profile.authUserId !== resolvedAuthUserId) {
          profile.authUserId = resolvedAuthUserId;
          updated = true;
        }
        if (profile.role === "patient") {
          if (cleanName && (!profile.fullName || profile.fullName === email.split("@")[0])) {
            profile.fullName = cleanName;
            updated = true;
          }
          if (cleanPhone && !profile.phone) {
            profile.phone = cleanPhone;
            updated = true;
          }
        }
        if (updated) {
          profile.updatedAt = nowIso;
        }
      }

      // Link any previous unlinked bookings matching this verified email
      for (const appt of db.appointments) {
        if (!appt.patientId && appt.patientEmail.toLowerCase() === email) {
          appt.patientId = profile.id;
        }
      }

      const doctor =
        profile.role === "doctor"
          ? db.doctors.find((d) => d.profileId === profile.id)
          : undefined;

      return { profile, doctorId: doctor?.id, isNewRegistration };
    });

    const verifiedEmailToken = signVerifiedEmailProof(email);
    const response = NextResponse.json({
      verified: true,
      email,
      verifiedEmailToken,
      registered: true,
      supabaseAuthUserId: resolvedAuthUserId || registration.profile.authUserId || null,
      isNewRegistration: registration.isNewRegistration || Boolean(supabaseAuth?.created),
      user: toPublicUser(registration.profile, registration.doctorId)
    });

    // Issue session cookie for explicit OTP login or for guest patient verification during booking
    const shouldIssueSession =
      parsed.data.intent === "login" ||
      (!currentUser && registration.profile.role === "patient");

    if (shouldIssueSession) {
      const sessionToken = signSessionToken(
        registration.profile.id,
        registration.profile.role
      );
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production"
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to verify email right now." },
      { status: 500 }
    );
  }
}
