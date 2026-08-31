"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Réordonne les images d'un produit et garantit qu'une seule image est MAIN.
 * Les autres types spécialisés (VARIANT, WORN, LACE_DETAIL, etc.) sont conservés.
 * Seule l'ancienne image MAIN est rétrogradée en GALLERY.
 */
export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await requireAdmin();

  const ids = [...new Set(orderedIds.filter(Boolean))];
  if (ids.length === 0) return { error: "No images to reorder." };

  const images = await db.productImage.findMany({
    where: { productId, id: { in: ids } },
    select: { id: true, kind: true },
  });

  if (images.length !== ids.length) return { error: "One or more images do not belong to this product." };

  const firstId = ids[0];

  await db.$transaction(async (tx) => {
    await tx.productImage.updateMany({
      where: { productId, kind: "MAIN", id: { not: firstId } },
      data: { kind: "GALLERY" },
    });

    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await tx.productImage.update({
        where: { id, productId },
        data: {
          sortOrder: index,
          ...(index === 0 ? { kind: "MAIN" as const } : {}),
        },
      });
    }
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}
