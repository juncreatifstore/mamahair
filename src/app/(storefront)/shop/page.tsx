import { listProducts, listCategories, type ProductFilters } from "@/server/products";
import { ShopLayout } from "@/components/storefront/shop-layout";
import { getT, getCurrency } from "@/i18n/server";

export async function generateMetadata() { const t = await getT(); return { title: t.shop.title }; }

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const [result, categories] = await Promise.all([listProducts({ ...(sp as ProductFilters), currency }), listCategories()]);
  return <ShopLayout title={t.shop.title} result={result} categories={categories} basePath="/shop" query={sp} />;
}
