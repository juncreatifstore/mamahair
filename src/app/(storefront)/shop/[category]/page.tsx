import type { Metadata } from "next";
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

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  try {
    const cat = await getCategoryBySlug(category);
    if (!cat) return { title: "Shop", robots: { index: false, follow: false } };

    const title = cat.name;
    const description = cat.description || `Shop ${cat.name} at MAMAHAIR.`;
    const canonical = `/shop/${cat.slug}`;
    const image = cat.imageUrl || undefined;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        url: canonical,
        title,
        description,
        images: image ? [{ url: image, alt: cat.name }] : undefined,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.error("Category metadata failed", { category, error });
    return {
      title: "Shop",
      alternates: { canonical: `/shop/${category}` },
    };
  }
}
