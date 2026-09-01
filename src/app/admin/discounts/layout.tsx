import { requireStaffPermission } from "@/lib/auth";
export default async function DiscountsLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("discounts.manage"); return children; }
