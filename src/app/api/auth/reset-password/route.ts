import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import { updateSupabaseAuthPassword } from "@/lib/supabase-auth";

const resetSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid token and new password (min 6 chars) are required." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    const result = await mutateDb((db) => {
      const record = db.passwordResetTokens.find(
        (t) => t.token === parsed.data.token
      );
      if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
        return { error: "Reset token is invalid or has expired." as const };
      }

      const profile = db.profiles.find(
        (p) => p.email.toLowerCase() === record.email.toLowerCase()
      );
      if (!profile) {
        return { error: "Account not found." as const };
      }

      profile.passwordHash = newHash;
      profile.updatedAt = new Date().toISOString();
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (t) => t.token !== parsed.data.token
      );

      return {
        success: true as const,
        email: profile.email,
        authUserId: profile.authUserId
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await updateSupabaseAuthPassword({
      email: result.email,
      authUserId: result.authUserId,
      newPassword: parsed.data.newPassword
    });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch {
    return NextResponse.json(
      { error: "Unable to reset password." },
      { status: 500 }
    );
  }
}
