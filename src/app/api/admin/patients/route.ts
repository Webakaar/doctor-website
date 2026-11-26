import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { mutateDb, readDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_patients")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const patients = db.profiles
    .filter((p) => p.role === "patient")
    .map((p) => {
      const appointments = db.appointments
        .filter(
          (a) =>
            a.patientId === p.id ||
            a.patientEmail.toLowerCase() === p.email.toLowerCase()
        )
        .map((a) => ({
          id: a.id,
          bookingRef: a.bookingRef,
          doctorName:
            db.doctors.find((d) => d.id === a.doctorId)?.fullName || "Unknown",
          serviceName:
            db.services.find((s) => s.id === a.serviceId)?.name || "General",
          appointmentDate: a.appointmentDate,
          slotStart: a.slotStart,
          status: a.status,
          paymentStatus: a.paymentStatus,
          consultationFee: a.consultationFee
        }))
        .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        isActive: p.isActive,
        createdAt: p.createdAt,
        appointmentsCount: appointments.length,
        appointments
      };
    });

  return NextResponse.json({ patients });
}

const toggleSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean()
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_patients")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await mutateDb((db) => {
    const profile = db.profiles.find(
      (p) => p.id === parsed.data.id && p.role === "patient"
    );
    if (!profile) return null;
    profile.isActive = parsed.data.isActive;
    profile.updatedAt = new Date().toISOString();
    return { id: profile.id, isActive: profile.isActive };
  });

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
