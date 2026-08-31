import { notFound } from "next/navigation";
import { listProducts, listCategories, getCategoryBySlug, type ProductFilters } from "@/server/products";
import { ShopLayout } from "@/components/storefront/shop-layout";
import { getCurrency } from "@/i18n/server";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { category } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  const currency = await getCurrency();
  const [result, categories] = await Promise.all([listProducts({ ...(sp as ProductFilters), category, currency }), listCategories()]);
  return <ShopLayout title={cat.name} description={cat.description} result={result} categories={categories} basePath={`/shop/${category}`} query={sp} />;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const cat = await getCategoryBySlug((await params).category);
  return { title: cat?.name ?? "Shop", description: cat?.description ?? undefined };
}
