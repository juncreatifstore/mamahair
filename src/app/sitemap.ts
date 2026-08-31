import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

/** Généré à la demande (pas de requête base au moment du build), mis en cache 1 h. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, categories, pages] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.page.findMany({ where: { isActive: true, locale: "en" }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/quiz`, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
  ];
}
