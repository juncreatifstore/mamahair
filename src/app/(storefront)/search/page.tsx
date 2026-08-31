import { listProducts, listCategories, type ProductFilters } from "@/server/products";
import { ShopLayout } from "@/components/storefront/shop-layout";
import { getT, getCurrency } from "@/i18n/server";
import { fmt } from "@/i18n";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const q = sp.q ?? "";
  const [result, categories] = await Promise.all([listProducts({ ...(sp as ProductFilters), q, currency }), listCategories()]);
  return <ShopLayout title={fmt(t.shop.searchResults, { q })} result={result} categories={categories} basePath="/search" query={sp} />;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) { return { title: `Search: ${(await searchParams).q ?? ""}`, robots: { index: false } }; }
