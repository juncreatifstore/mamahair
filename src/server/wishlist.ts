"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export async function getWishlist() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, slug: true, name: true, basePriceCents: true, currency: true, status: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } } } }, variant: { select: { id: true, name: true, priceCents: true } } },
  });
}

export async function getWishlistProductIds() {
  const user = await getCurrentUser();
  if (!user) return [] as string[];
  return (await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId);
}

/** Retourne { requiresAuth: true } pour les invités : le client stocke alors en localStorage. */
export async function toggleWishlist(productId: string, variantId?: string | null) {
  const user = await getCurrentUser();
  if (!user) return { requiresAuth: true as const };
  const existing = await db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) await db.wishlistItem.delete({ where: { id: existing.id } });
  else await db.wishlistItem.create({ data: { userId: user.id, productId, variantId: variantId ?? null } });
  revalidatePath("/account/wishlist");
  return { saved: !existing };
}

/** Fusion du localStorage invité après connexion. */
export async function mergeGuestWishlist(productIds: unknown) {
  const user = await getCurrentUser();
  const ids = z.array(z.string().uuid()).max(100).safeParse(productIds);
  if (!user || !ids.success || ids.data.length === 0) return { merged: 0 };
  await db.wishlistItem.createMany({ data: ids.data.map((productId) => ({ userId: user.id, productId })), skipDuplicates: true });
  revalidatePath("/account/wishlist");
  return { merged: ids.data.length };
}

export async function removeFromWishlist(productId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
}
