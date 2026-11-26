import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId, mutateDb } from "@/lib/db";
import { sendEmailNotification } from "@/lib/notifications";

const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email("Valid email address is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Please provide a brief message (min 10 chars)")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid enquiry form." },
        { status: 400 }
      );
    }

    const { enquiry, settings } = await mutateDb((db) => {
      const item = {
        id: generateId(),
        name: parsed.data.name.trim(),
        phone: parsed.data.phone.trim(),
        email: parsed.data.email.trim(),
        subject: parsed.data.subject.trim(),
        message: parsed.data.message.trim(),
        status: "new" as const,
        createdAt: new Date().toISOString()
      };
      db.enquiries.unshift(item);
      return { enquiry: item, settings: db.websiteSettings };
    });

    await sendEmailNotification({
      to: settings.email,
      subject: `[Contact Enquiry] ${enquiry.subject} - ${enquiry.name}`,
      text: `New enquiry from ${enquiry.name}\nPhone: ${enquiry.phone}\nEmail: ${enquiry.email}\n\n${enquiry.message}`,
      config: settings.notificationSettings
    });

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit enquiry." },
      { status: 500 }
    );
  }
}
