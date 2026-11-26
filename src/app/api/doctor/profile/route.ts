import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { mutateDb, readDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor" || !user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const doctor = db.doctors.find((d) => d.id === user.doctorId);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  const services = db.services.filter((s) => doctor.serviceIds.includes(s.id));
  return NextResponse.json({ doctor, services });
}

const doctorSelfUpdateSchema = z.object({
  biography: z.string().min(10).max(2000).optional(),
  photoUrl: z.string().optional()
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor" || !user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = doctorSelfUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile update details." },
      { status: 400 }
    );
  }

  const updated = await mutateDb((db) => {
    const doctor = db.doctors.find((d) => d.id === user.doctorId);
    if (!doctor) return null;

    if (parsed.data.biography !== undefined) {
      doctor.biography = parsed.data.biography.trim();
    }
    if (parsed.data.photoUrl !== undefined) {
      doctor.photoUrl = parsed.data.photoUrl.trim();
    }
    doctor.updatedAt = new Date().toISOString();
    return doctor;
  });

  if (!updated) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ doctor: updated });
}
