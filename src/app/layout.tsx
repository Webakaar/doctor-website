import type { Metadata } from "next";
import "./globals.css";
import { readDb } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = await readDb();
    const seo = db.websiteSettings.seoSettings;
    return {
      title: seo.homeTitle || db.websiteSettings.hospitalName,
      description: seo.homeDescription || db.websiteSettings.tagline
    };
  } catch {
    return {
      title: "AuraCare Multispeciality Hospital | Book Doctor Appointments Online",
      description:
        "Book appointments online with senior specialists across Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology, and Internal Medicine."
    };
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
