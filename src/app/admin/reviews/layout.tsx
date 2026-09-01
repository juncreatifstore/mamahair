import { requireStaffPermission } from "@/lib/auth";
export default async function ReviewsLayout({ children }: { children: React.ReactNode }) { await requireStaffPermission("reviews.manage"); return children; }
