import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { readDb } from "@/lib/db";
import type { PublicUser, StaffPermissions, UserProfile, UserRole } from "@/types/hospital";

export const SESSION_COOKIE_NAME = "auracare_session";

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "auracare-local-dev-secret-change-in-production-2026"
  );
}

interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(userId: string, role: UserRole): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.userId || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toPublicUser(
  profile: UserProfile,
  doctorId?: string
): PublicUser {
  const { passwordHash: _ignored, ...rest } = profile;
  void _ignored;
  return { ...rest, doctorId };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = await readDb();
  const profile = db.profiles.find((p) => p.id === payload.userId);
  if (!profile || !profile.isActive) return null;

  const doctor =
    profile.role === "doctor"
      ? db.doctors.find((d) => d.profileId === profile.id)
      : undefined;

  return toPublicUser(profile, doctor?.id);
}

export function hasAdminPermission(
  user: PublicUser | null,
  permission: keyof StaffPermissions
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.role === "staff") {
    return Boolean(user.permissions?.[permission]);
  }
  return false;
}

export function canAccessAdminPanel(user: PublicUser | null): boolean {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "staff";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
