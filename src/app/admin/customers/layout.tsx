import { requireStaffPermission } from "@/lib/auth";
export default async function CustomersLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("customers.manage"); return children; }
