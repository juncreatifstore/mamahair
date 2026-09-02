import { requireStaffPermission } from "@/lib/auth";
import { ProductAICopilot } from "@/components/admin/product-ai-copilot";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPermission("products.manage");
  return <><ProductAICopilot />{children}</>;
}
