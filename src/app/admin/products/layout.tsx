import { requireStaffPermission } from "@/lib/auth";
import { ProductAICopilot } from "@/components/admin/product-ai-copilot";
import { ProductMediaAIStudio } from "@/components/admin/product-media-ai-studio";
import { ProductVideoAIStudio } from "@/components/admin/product-video-ai-studio";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPermission("products.manage");
  return <><ProductAICopilot /><ProductMediaAIStudio /><ProductVideoAIStudio />{children}</>;
}
