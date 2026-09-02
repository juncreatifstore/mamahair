import { adminListCategories } from "@/server/admin/products";
import { getSection } from "@/lib/settings";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";

export default async function NewProductPage() {
  const [categories, commerce] = await Promise.all([adminListCategories(), getSection("commerce")]);
  return <><PageHeader title="New product" /><ProductForm categories={categories} currencies={commerce.enabledCurrencies} /></>;
}
