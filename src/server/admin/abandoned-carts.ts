"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendAbandonedCart } from "@/lib/email";

export async function adminListAbandonedCarts() {
  await requireAdmin();
  return db.cart.findMany({
    where: {
      convertedAt: null,
      items: { some: {} },
      lastActivityAt: { lt: new Date(Date.now() - 3600_000) },
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, isBlocked: true } },
      discount: { select: { code: true } },
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
              image: true,
              product: { select: { id: true, name: true, slug: true, currency: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
            },
          },
        },
      },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 200,
  });
}

export async function sendAbandonedCartRecovery(cartId: string): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      user: { select: { email: true, isBlocked: true } },
      items: {
        include: {
          variant: {
            include: {
              image: true,
              product: { select: { name: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.convertedAt || cart.items.length === 0) return { error: "This cart is no longer recoverable." };
  if (cart.recoveryEmailSentAt) return { error: "A recovery email was already sent for this cart." };
  if (cart.user?.isBlocked) return { error: "This customer is blocked. No recovery email was sent." };

  const email = cart.email ?? cart.user?.email ?? null;
  if (!email) return { error: "No email address is available for this cart." };

  await sendAbandonedCart(
    email,
    cart.items.map((i) => ({
      productName: i.variant.product.name,
      variantName: i.variant.name,
      quantity: i.quantity,
      imageUrl: i.variant.image?.url ?? i.variant.product.images[0]?.url ?? null,
    })),
    process.env.ABANDONED_CART_CODE,
  );

  await db.cart.update({ where: { id: cart.id }, data: { recoveryEmailSentAt: new Date() } });
  revalidatePath("/admin/abandoned-carts");
  revalidatePath("/admin/customers");
  return { ok: true };
}
