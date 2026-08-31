import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const FALLBACK_SITE_URL = "https://mamahair.vercel.app";

function getBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK_SITE_URL;
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();

  const core: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/quiz`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [products, categories, pages, posts] = await Promise.all([
      db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
      db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
      db.page.findMany({ where: { isActive: true, locale: "en" }, select: { slug: true, updatedAt: true } }),
      db.post.findMany({ where: { status: "PUBLISHED", locale: "en" }, select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...core,
      ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...pages.map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
      ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch (error) {
    console.error("sitemap DB lookup failed; serving core sitemap", error);
    return core;
  }
}
