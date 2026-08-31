import { db } from "./db";
import { percentOf } from "./money";

export type DiscountLike = { id: string; code: string; type: "PERCENT" | "FIXED" | "FREE_SHIPPING"; value: number; currency: string | null; minOrderCents: number | null; maxUses: number | null; usesPerCustomer: number | null; usedCount: number; startsAt: Date | null; endsAt: Date | null; isActive: boolean };

export type EligibleLine = { variantId: string; productId: string; categoryId: string | null; lineCents: number };

/**
 * Validation pure (testable) : dates, quotas, devise, minimum, éligibilité.
 * `eligibleCents` = sous-total des lignes concernées par la remise.
 */
export function validateDiscountRules(
  d: DiscountLike | null,
  ctx: { cartCurrency: string; subtotalCents: number; eligibleCents: number; customerUses?: number; now?: Date }
): { ok: true; discount: DiscountLike } | { ok: false; error: string } {
  const now = ctx.now ?? new Date();
  if (!d || !d.isActive) return { ok: false, error: "This code is not valid." };
  if (d.startsAt && d.startsAt > now) return { ok: false, error: "This code is not active yet." };
  if (d.endsAt && d.endsAt < now) return { ok: false, error: "This code has expired." };
  if (d.maxUses != null && d.usedCount >= d.maxUses) return { ok: false, error: "This code has been fully used." };
  if (d.usesPerCustomer != null && (ctx.customerUses ?? 0) >= d.usesPerCustomer) return { ok: false, error: "You have already used this code." };
  // Devise : une remise fixe ou un minimum de commande a une devise et ne s'applique qu'à un panier de la même devise.
  const needsCurrency = d.type === "FIXED" || d.minOrderCents != null;
  if (needsCurrency) {
    if (!d.currency) return { ok: false, error: "This code is misconfigured (missing currency)." };
    if (d.currency.toUpperCase() !== ctx.cartCurrency.toUpperCase()) return { ok: false, error: `This code only applies to orders in ${d.currency.toUpperCase()}.` };
  }
  if (d.minOrderCents != null && ctx.subtotalCents < d.minOrderCents) return { ok: false, error: "Your order does not reach the minimum for this code." };
  if (ctx.eligibleCents <= 0 && d.type !== "FREE_SHIPPING") return { ok: false, error: "This code does not apply to the items in your cart." };
  return { ok: true, discount: d };
}

export function computeDiscountCents(d: { type: string; value: number }, eligibleCents: number) {
  if (eligibleCents <= 0) return 0;
  if (d.type === "PERCENT") return Math.min(percentOf(eligibleCents, Math.min(d.value, 100)), eligibleCents);
  if (d.type === "FIXED") return Math.min(d.value, eligibleCents);
  return 0;
}

/** Sous-total des lignes éligibles selon les restrictions catégories/produits du code. */
export function eligibleSubtotal(lines: EligibleLine[], restrict: { productIds: string[]; categoryIds: string[] }) {
  const unrestricted = restrict.productIds.length === 0 && restrict.categoryIds.length === 0;
  return lines
    .filter((l) => unrestricted || restrict.productIds.includes(l.productId) || (l.categoryId != null && restrict.categoryIds.includes(l.categoryId)))
    .reduce((s, l) => s + l.lineCents, 0);
}

/** Version base de données : charge le code + ses restrictions, compte les usages du client. */
export async function validateDiscount(code: string, cart: { currency: string; subtotalCents: number; lines: EligibleLine[]; userId?: string | null; email?: string | null }) {
  const d = await db.discount.findUnique({ where: { code: code.trim().toUpperCase() }, include: { products: { select: { id: true } }, categories: { select: { id: true } } } });
  if (!d) return { ok: false as const, error: "This code is not valid." };
  const restrict = { productIds: d.products.map((p) => p.id), categoryIds: d.categories.map((c) => c.id) };
  const eligibleCents = eligibleSubtotal(cart.lines, restrict);
  let customerUses = 0;
  if (d.usesPerCustomer != null && (cart.userId || cart.email)) {
    customerUses = await db.order.count({
      where: { discountCode: d.code, status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] }, OR: [cart.userId ? { userId: cart.userId } : {}, cart.email ? { email: cart.email } : {}] },
    });
  }
  const res = validateDiscountRules(d, { cartCurrency: cart.currency, subtotalCents: cart.subtotalCents, eligibleCents, customerUses });
  if (!res.ok) return res;
  return { ok: true as const, discount: d, eligibleCents, discountCents: computeDiscountCents(d, eligibleCents), freeShipping: d.type === "FREE_SHIPPING" };
}
