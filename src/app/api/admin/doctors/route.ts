import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission, hashPassword } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import type { Doctor } from "@/types/hospital";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_doctors") && !hasAdminPermission(user, "view_dashboard")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const doctors = db.doctors.map((doc) => {
    const account = doc.profileId
      ? db.profiles.find((p) => p.id === doc.profileId)
      : undefined;
    return {
      ...doc,
      accountEmail: account?.email || null
    };
  });

  return NextResponse.json({ doctors, services: db.services });
}

const doctorPayloadSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2),
  photoUrl: z.string().optional().default(""),
  qualification: z.string().min(2),
  experienceYears: z.number().int().min(0).max(70),
  specialty: z.string().min(2),
  biography: z.string().optional().default(""),
  consultationFee: z.number().min(0),
  slotDurationMins: z.union([
    z.literal(15),
    z.literal(20),
    z.literal(30),
    z.literal(45),
    z.literal(60)
  ]),
  serviceIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  loginEmail: z.string().email().optional().or(z.literal("")),
  loginPassword: z.string().min(6).optional().or(z.literal(""))
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_doctors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = doctorPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid doctor details" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const pwdHash = data.loginPassword
    ? await hashPassword(data.loginPassword)
    : await hashPassword("Demo@1234");

  const result = await mutateDb((db) => {
    const now = new Date().toISOString();
    let profileId: string | undefined;

    if (data.loginEmail) {
      const normalized = data.loginEmail.trim().toLowerCase();
      const existing = db.profiles.find(
        (p) => p.email.toLowerCase() === normalized
      );
      if (existing) {
        return { error: "Login email is already in use by another account." as const };
      }
      profileId = generateId();
      db.profiles.push({
        id: profileId,
        email: normalized,
        fullName: data.fullName.trim(),
        phone: "",
        role: "doctor",
        permissions: {},
        passwordHash: pwdHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
    }

    const baseSlug = slugify(data.fullName);
    const uniqueSlug = db.doctors.some((d) => d.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const newDoctor: Doctor = {
      id: generateId(),
      profileId,
      slug: uniqueSlug,
      fullName: data.fullName.trim(),
      photoUrl: data.photoUrl || "",
      qualification: data.qualification.trim(),
      experienceYears: data.experienceYears,
      specialty: data.specialty.trim(),
      biography: data.biography.trim(),
      consultationFee: data.consultationFee,
      slotDurationMins: data.slotDurationMins,
      serviceIds: data.serviceIds,
      isActive: data.isActive,
      isVisible: data.isVisible,
      createdAt: now,
      updatedAt: now
    };

    db.doctors.push(newDoctor);

    // Seed default Mon-Sat schedule for new doctor
    for (let day = 0; day <= 6; day++) {
      db.doctorSchedules.push({
        id: generateId(),
        doctorId: newDoctor.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: day === 6 ? "14:00" : "17:00",
        breakStart: day === 6 ? undefined : "13:00",
        breakEnd: day === 6 ? undefined : "14:00",
        slotDurationMins: newDoctor.slotDurationMins,
        isAvailable: day !== 0
      });
    }

    return { doctor: newDoctor };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ doctor: result.doctor }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_doctors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = doctorPayloadSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      { error: "Doctor ID and valid fields are required." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updated = await mutateDb((db) => {
    const doc = db.doctors.find((d) => d.id === data.id);
    if (!doc) return null;
    doc.fullName = data.fullName.trim();
    doc.photoUrl = data.photoUrl;
    doc.qualification = data.qualification.trim();
    doc.experienceYears = data.experienceYears;
    doc.specialty = data.specialty.trim();
    doc.biography = data.biography.trim();
    doc.consultationFee = data.consultationFee;
    doc.slotDurationMins = data.slotDurationMins;
    doc.serviceIds = data.serviceIds;
    doc.isActive = data.isActive;
    doc.isVisible = data.isVisible;
    doc.updatedAt = new Date().toISOString();
    return doc;
  });

  if (!updated) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ doctor: updated });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_doctors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Doctor id required" }, { status: 400 });
  }

  const result = await mutateDb((db) => {
    const hasAppts = db.appointments.some((a) => a.doctorId === id);
    if (hasAppts) {
      const doc = db.doctors.find((d) => d.id === id);
      if (doc) {
        doc.isActive = false;
        doc.isVisible = false;
        doc.updatedAt = new Date().toISOString();
      }
      return { deactivatedInstead: true };
    }
    db.doctors = db.doctors.filter((d) => d.id !== id);
    db.doctorSchedules = db.doctorSchedules.filter((s) => s.doctorId !== id);
    db.blockedSlots = db.blockedSlots.filter((b) => b.doctorId !== id);
    return { deactivatedInstead: false };
  });

  return NextResponse.json({ success: true, ...result });
}
