import { requireStaffPermission } from "@/lib/auth";
import { ProductAIToolbox } from "@/components/admin/product-ai-toolbox";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPermission("products.manage");
  return <><ProductAIToolbox />{children}</>;
}
