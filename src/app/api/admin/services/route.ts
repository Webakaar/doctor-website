import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import type { Service } from "@/types/hospital";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_services") && !hasAdminPermission(user, "view_dashboard")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const services = db.services
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((svc) => ({
      ...svc,
      doctorIds: db.doctors
        .filter((d) => d.serviceIds.includes(svc.id))
        .map((d) => d.id)
    }));

  return NextResponse.json({ services, doctors: db.doctors });
}

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  category: z.string().min(2),
  shortDescription: z.string().min(5),
  fullDescription: z.string().min(5),
  iconName: z.string().default("Stethoscope"),
  imageUrl: z.string().optional().default(""),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  doctorIds: z.array(z.string()).optional()
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_services")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid service details" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const service = await mutateDb((db) => {
    const now = new Date().toISOString();
    const baseSlug = slugify(data.name);
    const slug = db.services.some((s) => s.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const item: Service = {
      id: generateId(),
      slug,
      name: data.name.trim(),
      category: data.category.trim(),
      shortDescription: data.shortDescription.trim(),
      fullDescription: data.fullDescription.trim(),
      iconName: data.iconName,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished,
      displayOrder: data.displayOrder,
      createdAt: now,
      updatedAt: now
    };
    db.services.push(item);

    if (data.doctorIds) {
      db.doctors.forEach((doc) => {
        if (data.doctorIds!.includes(doc.id) && !doc.serviceIds.includes(item.id)) {
          doc.serviceIds.push(item.id);
        }
      });
    }

    return item;
  });

  return NextResponse.json({ service }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_services")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      { error: "Service ID and valid fields are required." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updated = await mutateDb((db) => {
    const svc = db.services.find((s) => s.id === data.id);
    if (!svc) return null;

    svc.name = data.name.trim();
    svc.category = data.category.trim();
    svc.shortDescription = data.shortDescription.trim();
    svc.fullDescription = data.fullDescription.trim();
    svc.iconName = data.iconName;
    svc.imageUrl = data.imageUrl;
    svc.isPublished = data.isPublished;
    svc.displayOrder = data.displayOrder;
    svc.updatedAt = new Date().toISOString();

    if (data.doctorIds) {
      db.doctors.forEach((doc) => {
        const shouldHave = data.doctorIds!.includes(doc.id);
        const has = doc.serviceIds.includes(svc.id);
        if (shouldHave && !has) doc.serviceIds.push(svc.id);
        if (!shouldHave && has) {
          doc.serviceIds = doc.serviceIds.filter((id) => id !== svc.id);
        }
      });
    }

    return svc;
  });

  if (!updated) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ service: updated });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, "manage_services")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Service id required" }, { status: 400 });
  }

  await mutateDb((db) => {
    const inUse = db.appointments.some((a) => a.serviceId === id);
    if (inUse) {
      const svc = db.services.find((s) => s.id === id);
      if (svc) svc.isPublished = false;
      return;
    }
    db.services = db.services.filter((s) => s.id !== id);
    db.doctors.forEach((d) => {
      d.serviceIds = d.serviceIds.filter((sid) => sid !== id);
    });
  });

  return NextResponse.json({ success: true });
}
