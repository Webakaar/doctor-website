import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/db/supabase-client";
import { verifyPasswordWithSupabaseAuth } from "@/lib/supabase-auth";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  toPublicUser,
  verifyPassword
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const db = await readDb();
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === email
    );

    if (!profile || !profile.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    let valid = await verifyPassword(parsed.data.password, profile.passwordHash);
    if (!valid && profile.authUserId && isSupabaseConfigured()) {
      valid = await verifyPasswordWithSupabaseAuth(email, parsed.data.password);
    }
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const doctor =
      profile.role === "doctor"
        ? db.doctors.find((d) => d.profileId === profile.id)
        : undefined;

    const token = signSessionToken(profile.id, profile.role);
    const response = NextResponse.json({
      user: toPublicUser(profile, doctor?.id)
    });

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
      { error: "Unable to process login request." },
      { status: 500 }
    );
  }
}
