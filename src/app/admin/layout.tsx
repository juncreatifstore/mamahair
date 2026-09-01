import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/settings";
import { getStaffAccess, effectivePermissions } from "@/lib/staff-access";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [b, toShip, reviews, access] = await Promise.all([
    getBrand(),
    db.order.count({ where: { status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP"] } } }),
    db.review.count({ where: { isApproved: false } }),
    user.role === "STAFF" ? getStaffAccess(user.email) : Promise.resolve(null),
  ]);
  const permissions = user.role === "ADMIN" ? ["*"] : effectivePermissions(access);
  return <div className="flex min-h-screen flex-col md:flex-row"><Sidebar storeName={b.storeName} badges={{ toShip, reviews }} permissions={permissions} isAdmin={user.role === "ADMIN"} /><div className="flex-1 p-4 md:p-8">{children}</div></div>;
}
