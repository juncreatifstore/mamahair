"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ProductStatus, ProductType } from "@prisma/client";

export type AdminProductCatalogFilters = {
  q?: string;
  status?: string;
  type?: string;
  category?: string;
};

export async function getAdminProductCatalog(filters: AdminProductCatalogFilters = {}) {
  await requireAdmin();
  const q = filters.q?.trim();
  const status = filters.status && ["ACTIVE", "DRAFT", "ARCHIVED"].includes(filters.status) ? filters.status as ProductStatus : undefined;
  const type = filters.type && ["WIG", "BUNDLE", "EXTENSION", "CLOSURE", "FRONTAL", "HAIR_CARE", "ACCESSORY", "KIT"].includes(filters.type) ? filters.type as ProductType : undefined;

  return db.product.findMany({
    where: {
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
        ],
      } : {}),
      ...(status ? { status } : {}),
      ...(type ? { productType: type } : {}),
      ...(filters.category ? { categoryId: filters.category } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      category: true,
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, include: { inventory: true } },
      _count: { select: { wishlistItems: true } },
    },
    take: 300,
  });
}
