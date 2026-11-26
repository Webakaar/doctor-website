import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { mutateDb, readDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_website") && !hasAdminPermission(user, "view_dashboard")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const staff =
    user?.role === "super_admin"
      ? db.profiles
          .filter((p) => p.role === "staff" || p.role === "super_admin")
          .map(({ passwordHash: _ignored, ...rest }) => {
            void _ignored;
            return rest;
          })
      : [];

  return NextResponse.json({
    settings: db.websiteSettings,
    enquiries: db.enquiries,
    staff
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_website")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.enquiryId && body.enquiryStatus) {
    const enquirySchema = z.enum(["new", "in_progress", "resolved"]);
    const statusParsed = enquirySchema.safeParse(body.enquiryStatus);
    if (!statusParsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await mutateDb((db) => {
      const enq = db.enquiries.find((e) => e.id === body.enquiryId);
      if (enq) enq.status = statusParsed.data;
    });
    return NextResponse.json({ success: true });
  }

  if (body.staffId && body.permissions && user?.role === "super_admin") {
    await mutateDb((db) => {
      const staff = db.profiles.find(
        (p) => p.id === body.staffId && p.role === "staff"
      );
      if (staff) {
        staff.permissions = body.permissions;
        staff.updatedAt = new Date().toISOString();
      }
    });
    return NextResponse.json({ success: true });
  }

  const updated = await mutateDb((db) => {
    const { notificationSettings: _keepNs, ...rest } = body;
    void _keepNs;
    db.websiteSettings = {
      ...db.websiteSettings,
      ...rest,
      updatedAt: new Date().toISOString()
    };
    return db.websiteSettings;
  });

  return NextResponse.json({ settings: updated });
}
