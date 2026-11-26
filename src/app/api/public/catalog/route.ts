import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  const { notificationSettings: _ns, ...safeSettings } = db.websiteSettings;
  void _ns;

  return NextResponse.json({
    settings: safeSettings,
    services: db.services
      .filter((s) => s.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder),
    doctors: db.doctors.filter((d) => d.isActive && d.isVisible),
    schedules: db.doctorSchedules
  });
}
