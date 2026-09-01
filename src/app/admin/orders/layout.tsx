import { requireStaffPermission } from "@/lib/auth";
export default async function OrdersLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("orders.manage"); return children; }
