import { requireStaffPermission } from "@/lib/auth";
export default async function AbandonedLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("abandoned.manage"); return children; }
