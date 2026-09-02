import { requireStaffPermission } from "@/lib/auth";
import { ProductAICopilot } from "@/components/admin/product-ai-copilot";
import { ProductVideoAIStudio } from "@/components/admin/product-video-ai-studio";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPermission("products.manage");
  return <><ProductAICopilot /><ProductVideoAIStudio />{children}</>;
}
