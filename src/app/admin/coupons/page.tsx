import { redirect } from "next/navigation";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminCouponsClient } from "@/components/AdminCouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [user, db] = await Promise.all([getCurrentUser(), readDb()]);
  if (
    !hasAdminPermission(user, "manage_payments") &&
    !hasAdminPermission(user, "manage_website")
  ) {
    redirect("/admin");
  }

  const coupons = db.coupons
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <AdminCouponsClient initialCoupons={coupons} />;
}
