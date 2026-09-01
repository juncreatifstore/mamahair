import { requireStaffPermission } from "@/lib/auth";
export default async function EmailsLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("emails.manage"); return children; }
