import type { MetadataRoute } from "next";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/doctors",
    "/book",
    "/login",
    "/contact"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));

  try {
    const db = await readDb();
    const serviceRoutes = db.services
      .filter((s) => s.isPublished)
      .map((s) => ({
        url: `${baseUrl}/services/${s.slug}`,
        lastModified: new Date(s.updatedAt)
      }));

    const doctorRoutes = db.doctors
      .filter((d) => d.isActive && d.isVisible)
      .map((d) => ({
        url: `${baseUrl}/doctors/${d.slug}`,
        lastModified: new Date(d.updatedAt)
      }));

    return [...staticRoutes, ...serviceRoutes, ...doctorRoutes];
  } catch {
    return staticRoutes;
  }
}
