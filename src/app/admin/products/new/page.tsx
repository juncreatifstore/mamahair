import { adminListCategories } from "@/server/admin/products";
import { getSection } from "@/lib/settings";
import { ProductForm } from "@/components/admin/product-form";
import { ProductAIToolbox } from "@/components/admin/product-ai-toolbox";
import { PageHeader } from "@/components/admin/ui";

export default async function NewProductPage() {
  const [categories, commerce] = await Promise.all([adminListCategories(), getSection("commerce")]);
  return (
    <>
      <PageHeader title="New product" sub="Create the core product first, then refine media, variants and SEO." />
      <ProductAIToolbox />
      <ProductForm categories={categories} currencies={commerce.enabledCurrencies} />
    </>
  );
}
