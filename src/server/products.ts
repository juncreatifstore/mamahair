import { db } from "@/lib/db";
import type { HairType, Prisma, ProductType } from "@prisma/client";

export type ProductFilters = {
  category?: string; hairType?: string; concern?: string; texture?: string; length?: string; color?: string; lace?: string; density?: string;
  type?: string; q?: string; minPrice?: string; maxPrice?: string; inStock?: string; isNew?: string; bestSeller?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular"; currency?: string; page?: string;
};

const cardSelect = {
  id: true, slug: true, name: true, shortDesc: true, basePriceCents: true, compareAtCents: true, currency: true, productType: true,
  hairTypes: true, textures: true, lengths: true, isNew: true, isBestSeller: true, ratingAvg: true, ratingCount: true, salesCount: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 2, select: { url: true, alt: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;
export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function buildWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (f.currency) where.currency = f.currency.toUpperCase();
  if (f.category) where.category = { OR: [{ slug: f.category }, { parent: { slug: f.category } }] };
  if (f.type) where.productType = f.type.toUpperCase() as ProductType;
  if (f.hairType) where.hairTypes = { has: f.hairType as HairType };
  if (f.concern) where.concerns = { has: f.concern };
  if (f.texture) where.textures = { has: f.texture };
  if (f.length) where.lengths = { has: parseInt(f.length, 10) };
  if (f.color) where.colors = { has: f.color };
  if (f.lace) where.laceTypes = { has: f.lace };
  if (f.density) where.densities = { has: f.density };
  if (f.isNew) where.isNew = true;
  if (f.bestSeller) where.isBestSeller = true;
  if (f.minPrice || f.maxPrice) where.basePriceCents = { ...(f.minPrice ? { gte: Math.round(parseFloat(f.minPrice) * 100) } : {}), ...(f.maxPrice ? { lte: Math.round(parseFloat(f.maxPrice) * 100) } : {}) };
  if (f.inStock) where.variants = { some: { isActive: true, inventory: { is: { quantity: { gt: db.inventory.fields.reserved } } } } };
  if (f.q) {
    const q = f.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } }, { shortDesc: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
      { category: { name: { contains: q, mode: "insensitive" } } }, { textures: { has: q } },
      ...lengthClause(q),
      ...typeClauses(q),
    ];
  }
  return where;
}

const TYPE_NAMES = ["WIG", "BUNDLE", "EXTENSION", "CLOSURE", "FRONTAL", "HAIR_CARE", "ACCESSORY", "KIT"];
const lengthClause = (q: string): Prisma.ProductWhereInput[] => (/^\d+$/.test(q) ? [{ lengths: { has: parseInt(q, 10) } }] : []);
const typeClauses = (q: string): Prisma.ProductWhereInput[] => TYPE_NAMES.filter((t) => t.toLowerCase().startsWith(q.toLowerCase())).map((t) => ({ productType: t as ProductType }));

const PAGE_SIZE = 24;

export async function listProducts(f: ProductFilters = {}) {
  const where = buildWhere(f);
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.sort === "price-asc" ? [{ basePriceCents: "asc" }] : f.sort === "price-desc" ? [{ basePriceCents: "desc" }] : f.sort === "popular" ? [{ salesCount: "desc" }, { ratingCount: "desc" }] : [{ createdAt: "desc" }];
  const page = Math.max(1, parseInt(f.page ?? "1", 10) || 1);
  const [items, total] = await Promise.all([
    db.product.findMany({ where, orderBy, select: cardSelect, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.ceil(total / PAGE_SIZE) };
}

export const getFeaturedProducts = (take = 8, currency?: string) => db.product.findMany({ where: { status: "ACTIVE", isFeatured: true, ...(currency ? { currency } : {}) }, take, select: cardSelect, orderBy: { updatedAt: "desc" } });
export const getBestSellers = (take = 8, currency?: string) => db.product.findMany({ where: { status: "ACTIVE", ...(currency ? { currency } : {}), OR: [{ isBestSeller: true }, { salesCount: { gt: 0 } }] }, take, select: cardSelect, orderBy: [{ isBestSeller: "desc" }, { salesCount: "desc" }] });
export const getNewArrivals = (take = 8, currency?: string) => db.product.findMany({ where: { status: "ACTIVE", ...(currency ? { currency } : {}), OR: [{ isNew: true }, { createdAt: { gt: new Date(Date.now() - 45 * 86400_000) } }] }, take, select: cardSelect, orderBy: { createdAt: "desc" } });

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: true } },
      variants: { where: { isActive: true }, include: { inventory: true, image: true }, orderBy: { priceCents: "asc" } },
      reviews: { where: { isApproved: true }, include: { user: { select: { firstName: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      bundleItems: { include: { variant: { include: { product: { select: { name: true, slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } } } } },
    },
  });
}

export async function getRelatedProducts(product: { id: string; categoryId: string | null; productType: string; currency: string }, take = 4) {
  return db.product.findMany({
    where: { status: "ACTIVE", id: { not: product.id }, currency: product.currency, OR: [{ categoryId: product.categoryId ?? undefined }, { productType: product.productType as ProductType }] },
    take, select: cardSelect, orderBy: { salesCount: "desc" },
  });
}

export const listCategories = () => db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
export const getCategoryBySlug = (slug: string) => db.category.findUnique({ where: { slug } });

/** Suggestions rapides (autocomplete). */
export async function searchSuggestions(q: string, take = 6) {
  if (q.trim().length < 2) return { products: [], categories: [] };
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: buildWhere({ q }), select: { slug: true, name: true, basePriceCents: true, currency: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } }, take, orderBy: { salesCount: "desc" } }),
    db.category.findMany({ where: { isActive: true, name: { contains: q, mode: "insensitive" } }, select: { slug: true, name: true }, take: 3 }),
  ]);
  return { products, categories };
}
