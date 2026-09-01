import { requireStaffPermission } from "@/lib/auth";
export default async function ContentLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("content.manage"); return children; }
