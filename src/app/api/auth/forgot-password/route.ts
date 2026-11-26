import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mutateDb } from "@/lib/db";
import { sendEmailNotification } from "@/lib/notifications";

const forgotSchema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const resetResult = await mutateDb((db) => {
      const profile = db.profiles.find((p) => p.email.toLowerCase() === email);
      if (!profile) {
        return { found: false as const, settings: db.websiteSettings };
      }

      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (t) => t.email !== email
      );
      db.passwordResetTokens.push({ token, email, expiresAt });

      return { found: true as const, token, settings: db.websiteSettings };
    });

    if (resetResult.found) {
      await sendEmailNotification({
        to: email,
        subject: `Password Reset - ${resetResult.settings.hospitalName}`,
        text: `Use this reset token to set a new password: ${resetResult.token}`,
        config: resetResult.settings.notificationSettings
      });
    }

    return NextResponse.json({
      message:
        "If an account exists for that email, password reset instructions have been issued.",
      // Exposed only when SMTP is not configured so local testing works smoothly
      demoResetToken:
        resetResult.found &&
        !resetResult.settings.notificationSettings.smtpHost
          ? resetResult.token
          : undefined
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
