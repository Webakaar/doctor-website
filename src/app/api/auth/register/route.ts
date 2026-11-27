import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId, mutateDb, readDb } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  hashPassword,
  signSessionToken,
  toPublicUser
} from "@/lib/auth";
import { ensureSupabaseAuthUser } from "@/lib/supabase-auth";
import type { UserProfile } from "@/types/hospital";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration details." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existingDb = await readDb();
    if (existingDb.profiles.some((p) => p.email.toLowerCase() === email)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const supabaseAuth = await ensureSupabaseAuthUser({
      email,
      password: parsed.data.password,
      fullName: parsed.data.fullName.trim(),
      phone: parsed.data.phone.trim(),
      role: "patient",
      emailConfirm: true
    });

    const created = await mutateDb((db) => {
      const exists = db.profiles.some((p) => p.email.toLowerCase() === email);
      if (exists) {
        return { error: "An account with this email already exists." as const };
      }

      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: generateId(),
        authUserId: supabaseAuth?.authUserId,
        email,
        fullName: parsed.data.fullName.trim(),
        phone: parsed.data.phone.trim(),
        role: "patient",
        permissions: {},
        passwordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      db.profiles.push(newProfile);

      // Link any previous guest bookings matching this email
      db.appointments.forEach((appt) => {
        if (
          !appt.patientId &&
          appt.patientEmail.toLowerCase() === email
        ) {
          appt.patientId = newProfile.id;
        }
      });

      return { profile: newProfile };
    });

    if ("error" in created) {
      return NextResponse.json({ error: created.error }, { status: 409 });
    }

    const token = signSessionToken(created.profile.id, created.profile.role);
    const response = NextResponse.json(
      { user: toPublicUser(created.profile) },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to create patient account." },
      { status: 500 }
    );
  }
}
