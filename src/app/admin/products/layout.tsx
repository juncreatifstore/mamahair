import { requireStaffPermission } from "@/lib/auth";
import { ProductAICopilot } from "@/components/admin/product-ai-copilot";
import { ProductAITranslations } from "@/components/admin/product-ai-translations";
import { ProductMediaAIStudioSafe } from "@/components/admin/product-media-ai-studio-safe";
import { ProductVideoAIStudio } from "@/components/admin/product-video-ai-studio";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPermission("products.manage");
  return <><ProductAICopilot /><ProductAITranslations /><ProductMediaAIStudioSafe /><ProductVideoAIStudio />{children}</>;
}
