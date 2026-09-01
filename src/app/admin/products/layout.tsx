import { requireStaffPermission } from "@/lib/auth";
export default async function ProductsLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("products.manage"); return children; }
