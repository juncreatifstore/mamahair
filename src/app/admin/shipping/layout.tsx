import { requireStaffPermission } from "@/lib/auth";
export default async function ShippingLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("shipping.manage"); return children; }
