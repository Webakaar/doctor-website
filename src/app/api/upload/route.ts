import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/db/supabase-client";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml"
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "staff", "doctor"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, or SVG images are supported." },
        { status: 400 }
      );
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 3 MB." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.storage
        .from("hospital-assets")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        });
      if (!error) {
        const { data } = supabase.storage
          .from("hospital-assets")
          .getPublicUrl(filename);
        return NextResponse.json({ url: data.publicUrl });
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }
}
