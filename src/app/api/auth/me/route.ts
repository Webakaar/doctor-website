import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { mutateDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional()
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await mutateDb(async (db) => {
      const profile = db.profiles.find((p) => p.id === user.id);
      if (!profile) return { error: "Account not found", status: 404 as const };

      if (parsed.data.newPassword) {
        if (!parsed.data.currentPassword) {
          return {
            error: "Current password is required to set a new password.",
            status: 400 as const
          };
        }
        const ok = await verifyPassword(
          parsed.data.currentPassword,
          profile.passwordHash
        );
        if (!ok) {
          return {
            error: "Current password is incorrect.",
            status: 400 as const
          };
        }
        profile.passwordHash = await hashPassword(parsed.data.newPassword);
      }

      if (parsed.data.fullName) profile.fullName = parsed.data.fullName.trim();
      if (parsed.data.phone) profile.phone = parsed.data.phone.trim();
      profile.updatedAt = new Date().toISOString();

      return {
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone,
          role: profile.role,
          permissions: profile.permissions,
          isActive: profile.isActive,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          doctorId: user.doctorId
        }
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}
