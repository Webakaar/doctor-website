import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import {
  sendEmailNotification,
  sendMsg91Sms,
  sendWhatsAppMessage
} from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_notifications")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  return NextResponse.json({
    settings: db.websiteSettings.notificationSettings,
    logs: db.notificationLogs.slice(0, 100)
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_notifications")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await mutateDb((db) => {
    db.websiteSettings.notificationSettings = {
      ...db.websiteSettings.notificationSettings,
      ...body
    };
    db.websiteSettings.updatedAt = new Date().toISOString();
    return db.websiteSettings.notificationSettings;
  });

  return NextResponse.json({ settings: updated });
}

const testSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp"]),
  recipient: z.string().min(3)
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_notifications")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Channel and recipient are required." },
      { status: 400 }
    );
  }

  const db = await readDb();
  const cfg = db.websiteSettings.notificationSettings;

  const result =
    parsed.data.channel === "email"
      ? await sendEmailNotification({
          to: parsed.data.recipient,
          subject: `Test Email - ${db.websiteSettings.hospitalName}`,
          text: "This is a test notification from your Hospital Admin Notification Settings.",
          config: cfg
        })
      : parsed.data.channel === "sms"
      ? await sendMsg91Sms({
          mobile: parsed.data.recipient,
          variables: {
            patientName: "Test Patient",
            bookingRef: "TEST-1001",
            doctorName: "Dr. Arjun Mehta",
            date: new Date().toISOString().slice(0, 10),
            time: "10:00 AM"
          },
          config: cfg
        })
      : await sendWhatsAppMessage({
          mobile: parsed.data.recipient,
          templateName: cfg.whatsappTemplateConfirmed,
          variables: [
            "Test Patient",
            "TEST-1001",
            "Dr. Arjun Mehta",
            new Date().toISOString().slice(0, 10),
            "10:00 AM"
          ],
          config: cfg
        });

  const logEntry = await mutateDb((d) => {
    const entry = {
      id: generateId(),
      channel: parsed.data.channel,
      event: "test_dispatch" as const,
      recipientRef: parsed.data.recipient,
      providerMessageId: result.providerMessageId,
      status: result.status,
      errorMessage: result.errorMessage,
      sentAt: new Date().toISOString()
    };
    d.notificationLogs.unshift(entry);
    return entry;
  });

  return NextResponse.json({ result, log: logEntry });
}
