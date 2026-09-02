"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type InventoryFilter = "" | "out" | "low" | "available";

export async function getAdminInventory(q = "", stock: InventoryFilter = "") {
  await requireAdmin();
  const search = q.trim();
  const variants = await db.productVariant.findMany({
    where: {
      isActive: true,
      ...(search ? {
        OR: [
          { sku: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { product: { name: { contains: search, mode: "insensitive" } } },
          { product: { sku: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    orderBy: [{ product: { name: "asc" } }, { priceCents: "asc" }],
    include: {
      inventory: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          currency: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      },
    },
    take: 600,
  });

  if (!stock) return variants;
  return variants.filter((variant) => {
    const quantity = variant.inventory?.quantity ?? 0;
    const reserved = variant.inventory?.reserved ?? 0;
    const available = Math.max(0, quantity - reserved);
    const lowAt = variant.inventory?.lowStockAt ?? 5;
    if (stock === "out") return available === 0;
    if (stock === "low") return available > 0 && available <= lowAt;
    if (stock === "available") return available > lowAt;
    return true;
  });
}

export async function updateVariantInventory(formData: FormData) {
  await requireAdmin();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const requestedQuantity = Math.max(0, Number.parseInt(String(formData.get("quantity") ?? "0"), 10) || 0);
  const lowStockAt = Math.max(0, Number.parseInt(String(formData.get("lowStockAt") ?? "5"), 10) || 0);
  if (!variantId) return;

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true, product: { select: { slug: true } }, inventory: { select: { reserved: true } } },
  });
  if (!variant) return;

  // Never allow a stock edit to invalidate units already reserved by open orders.
  const quantity = Math.max(requestedQuantity, variant.inventory?.reserved ?? 0);

  await db.inventory.upsert({
    where: { variantId },
    create: { variantId, quantity, lowStockAt },
    update: { quantity, lowStockAt },
  });

  revalidatePath("/admin/products/inventory");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath(`/products/${variant.product.slug}`);
  revalidatePath("/shop");
}
