import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/settings";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [b, toShip, reviews] = await Promise.all([getBrand(), db.order.count({ where: { status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP"] } } }), db.review.count({ where: { isApproved: false } })]);
  return <div className="flex min-h-screen flex-col md:flex-row"><Sidebar storeName={b.storeName} badges={{ toShip, reviews }} /><div className="flex-1 p-4 md:p-8">{children}</div></div>;
}
