"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartSessionId, setCartSessionId } from "@/lib/cart-session";
import { validateDiscount, type EligibleLine } from "@/lib/discount";
import { available } from "@/lib/stock";
import { getCurrency } from "@/i18n/server";
import { getRatesForCountry, computeShippingCents, cartWeightGrams } from "@/lib/shipping";
import { getSection } from "@/lib/settings";
import { z } from "zod";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, categoryId: true, weightGrams: true, currency: true, images: { take: 1, orderBy: { sortOrder: "asc" as const } } } },
          inventory: true,
          image: true,
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
  discount: { include: { products: { select: { id: true } }, categories: { select: { id: true } } } },
};

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

/** Panier courant (utilisateur ou session invitée). Fusionne le panier invité dans celui du client à la connexion. */
export async function getCart() {
  const user = await getCurrentUser();
  const sessionId = await getCartSessionId();

  if (user) {
    const own = await db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
    const guest = sessionId ? await db.cart.findUnique({ where: { sessionId }, include: { items: true } }) : null;
    if (guest && guest.userId !== user.id) {
      if (!own) {
        return db.cart.update({ where: { id: guest.id }, data: { userId: user.id, sessionId: null }, include: cartInclude });
      }
      // Fusion ligne par ligne, puis suppression du panier invité
      for (const gi of guest.items) {
        await db.cartItem.upsert({
          where: { cartId_variantId: { cartId: own.id, variantId: gi.variantId } },
          update: { quantity: { increment: gi.quantity } },
          create: { cartId: own.id, variantId: gi.variantId, quantity: gi.quantity },
        });
      }
      await db.cart.delete({ where: { id: guest.id } });
      return db.cart.findUnique({ where: { id: own.id }, include: cartInclude });
    }
    return own;
  }
  if (sessionId) return db.cart.findUnique({ where: { sessionId }, include: cartInclude });
  return null;
}

async function getOrCreateCart() {
  const existing = await getCart();
  if (existing) return existing;
  const user = await getCurrentUser();
  const currency = await getCurrency();
  if (user) return db.cart.create({ data: { userId: user.id, currency }, include: cartInclude });
  const sessionId = crypto.randomUUID();
  await setCartSessionId(sessionId);
  return db.cart.create({ data: { sessionId, currency }, include: cartInclude });
}

export type CartTotals = { subtotalCents: number; count: number; discountCents: number; freeShipping: boolean; discountError?: string; lines: EligibleLine[]; weightGrams: number };

/** Totaux recalculés côté serveur à partir des prix en base (jamais du navigateur). */
export async function cartTotals(cart: Awaited<ReturnType<typeof getCart>>): Promise<CartTotals> {
  if (!cart) return { subtotalCents: 0, count: 0, discountCents: 0, freeShipping: false, lines: [], weightGrams: 0 };
  // Un panier ne contient que des articles dans sa devise ; les autres sont ignorés du total et signalés.
  const items = cart.items.filter((i) => i.variant.product.currency === cart.currency);
  const lines: EligibleLine[] = items.map((i) => ({ variantId: i.variantId, productId: i.variant.product.id, categoryId: i.variant.product.categoryId, lineCents: i.variant.priceCents * i.quantity }));
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const weightGrams = cartWeightGrams(items);
  let discountCents = 0, freeShipping = false, discountError: string | undefined;
  if (cart.discount) {
    const user = await getCurrentUser();
    const v = await validateDiscount(cart.discount.code, { currency: cart.currency, subtotalCents, lines, userId: user?.id, email: user?.email ?? cart.email });
    if (v.ok) { discountCents = v.discountCents; freeShipping = v.freeShipping; } else discountError = v.error;
  }
  return { subtotalCents, count, discountCents, freeShipping, discountError, lines, weightGrams };
}

/** Estimation livraison + taxe pour le panier (pays par défaut ou pays choisi). */
export async function estimateShipping(country?: string) {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) return null;
  const totals = await cartTotals(cart);
  const commerce = await getSection("commerce");
  const c = (country ?? commerce.enabledCountries[0] ?? "US").toUpperCase();
  const rates = await getRatesForCountry(c, cart.currency, totals.weightGrams);
  const cheapest = rates[0];
  const shippingCents = cheapest ? (totals.freeShipping ? 0 : computeShippingCents(cheapest, totals.subtotalCents - totals.discountCents, cart.currency)) : null;
  const tax = await db.taxRate.findFirst({ where: { isActive: true, region: null, zone: { countries: { has: c } } } });
  const taxCents = tax ? Math.round(((totals.subtotalCents - totals.discountCents + (shippingCents ?? 0)) * tax.rateBps) / 10000) : null;
  return { country: c, rateName: cheapest?.name ?? null, shippingCents, taxCents };
}

const qtySchema = z.number().int().min(1).max(20);

export async function addToCart(variantId: string, quantity = 1) {
  const q = qtySchema.safeParse(quantity);
  if (!q.success) return { error: "Invalid quantity." };
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true, product: { select: { status: true, currency: true } } } });
  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") return { error: "This product is unavailable." };
  const cart = await getOrCreateCart();
  if (variant.product.currency !== cart.currency) return { error: `This item is priced in ${variant.product.currency}; switch currency to add it.` };
  const existing = cart.items.find((i) => i.variantId === variantId);
  const wanted = (existing?.quantity ?? 0) + q.data;
  if (available(variant.inventory) < wanted) return { error: "Not enough stock." };
  await db.$transaction([
    db.cartItem.upsert({ where: { cartId_variantId: { cartId: cart.id, variantId } }, update: { quantity: wanted }, create: { cartId: cart.id, variantId, quantity: q.data } }),
    db.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await getCart();
  const item = cart?.items.find((i) => i.id === itemId);
  if (!cart || !item) return { error: "Item not found." }; // IDOR : l'article doit appartenir au panier courant
  if (quantity <= 0) await db.cartItem.delete({ where: { id: itemId } });
  else {
    if (available(item.variant.inventory) < quantity) return { error: "Not enough stock." };
    await db.cartItem.update({ where: { id: itemId }, data: { quantity: Math.min(quantity, 20) } });
  }
  await db.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItem(itemId: string) {
  const cart = await getCart();
  if (!cart?.items.some((i) => i.id === itemId)) return;
  await db.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/", "layout");
}

export async function applyDiscount(code: string) {
  const cart = await getCart();
  if (!cart) return { error: "Your cart is empty." };
  const totals = await cartTotals({ ...cart, discount: null });
  const user = await getCurrentUser();
  const res = await validateDiscount(code, { currency: cart.currency, subtotalCents: totals.subtotalCents, lines: totals.lines, userId: user?.id, email: user?.email ?? cart.email });
  if (!res.ok) return { error: res.error };
  await db.cart.update({ where: { id: cart.id }, data: { discountId: res.discount.id } });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeDiscount() {
  const cart = await getCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { discountId: null } });
  revalidatePath("/cart");
}

/** Change la devise du panier (vide les lignes d'une autre devise). */
export async function switchCartCurrency(currency: string) {
  const cart = await getCart();
  if (!cart) return;
  const cur = currency.toUpperCase();
  const foreign = cart.items.filter((i) => i.variant.product.currency !== cur).map((i) => i.id);
  await db.cart.update({ where: { id: cart.id }, data: { currency: cur, items: { deleteMany: { id: { in: foreign } } } } });
  revalidatePath("/", "layout");
}
