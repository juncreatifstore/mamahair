"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSection } from "@/lib/settings";
import { getRatesForCountry, computeShippingCents } from "@/lib/shipping";
import { validateDiscount } from "@/lib/discount";
import { reserveStock, releaseOrderReservations, lockOrder, InsufficientStockError } from "@/lib/stock";
import { getPaymentProvider } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { checkoutSchema } from "@/schemas/checkout";
import { getLocale } from "@/i18n/server";
import { getCart, cartTotals } from "./cart";

const FALLBACK_SITE = "https://mamahair.vercel.app";
function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK_SITE;
    return url.origin;
  } catch {
    return FALLBACK_SITE;
  }
}
const SITE = getSiteUrl();

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string[]> };

/**
 * Checkout robuste :
 * 1. Validation Zod + recalcul de TOUS les prix côté serveur (jamais depuis le navigateur).
 * 2. Transaction : création commande PENDING_PAYMENT + réservation de stock ATOMIQUE
 *    (UPDATE conditionnel `quantity - reserved >= qty`, donc pas de survente).
 * 3. Création de la session de paiement HORS transaction. Si elle échoue → rollback :
 *    libération des réservations + commande CANCELLED.
 * 4. Expiration : Order.expiresAt + Stripe expires_at + cron /api/cron/expire-reservations.
 * 5. Le webhook est la seule autorité qui passe une commande en PAID.
 */
export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const rl = await rateLimit("checkout", 10, 10 * 60_000);
  if (!rl.ok) return { error: "Too many checkout attempts. Please wait a moment." };

  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    shippingRateId: formData.get("shippingRateId"),
    notes: formData.get("notes") ?? "",
    saveAddress: formData.get("saveAddress") === "on",
    address: {
      fullName: formData.get("fullName"), line1: formData.get("line1"), line2: formData.get("line2"), city: formData.get("city"),
      region: formData.get("region"), postalCode: formData.get("postalCode"), country: formData.get("country"), phone: formData.get("phone"),
    },
  });
  if (!parsed.success) return { error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const { email, shippingRateId, address, notes, saveAddress } = parsed.data;
  address.country = address.country.toUpperCase();

  const [commerce, payments, user, locale] = await Promise.all([getSection("commerce"), getSection("payments"), getCurrentUser(), getLocale()]);
  if (!commerce.enabledCountries.includes(address.country)) return { error: "We don't ship to this country yet." };
  if (!user && !commerce.allowGuestCheckout) return { error: "Please sign in to check out." };
  if (user?.isBlocked) return { error: "This account cannot place orders. Contact support." };

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return { error: "Your cart is empty." };
  const currency = cart.currency;
  const items = cart.items.filter((i) => i.variant.product.currency === currency && i.variant.isActive);
  if (items.length === 0) return { error: "Your cart has no items available in this currency." };

  const totals = await cartTotals(cart);
  if (totals.discountError) return { error: `${totals.discountError} Remove the code to continue.` };

  const rates = await getRatesForCountry(address.country, currency, totals.weightGrams);
  const rate = rates.find((r) => r.id === shippingRateId);
  if (!rate) return { error: "Choose a valid delivery method." };

  let discountCents = 0, freeShipping = false, discountCode: string | null = null;
  if (cart.discount) {
    const v = await validateDiscount(cart.discount.code, { currency, subtotalCents: totals.subtotalCents, lines: totals.lines, userId: user?.id, email });
    if (!v.ok) return { error: `${v.error} Remove the code to continue.` };
    discountCents = v.discountCents; freeShipping = v.freeShipping; discountCode = v.discount.code;
  }
  const shippingCents = freeShipping ? 0 : computeShippingCents(rate, totals.subtotalCents - discountCents, currency);
  const totalCents = totals.subtotalCents - discountCents + shippingCents;
  const expiresAt = new Date(Date.now() + Math.min(1440, Math.max(30, commerce.reservationMinutes)) * 60_000);

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: user?.id ?? null, email, phone: address.phone || null, status: "PENDING_PAYMENT", currency,
          subtotalCents: totals.subtotalCents, discountCents, shippingCents, totalCents, discountCode,
          shippingAddress: address, shippingRateId: rate.id, notes: notes || null, locale, expiresAt,
          items: {
            create: items.map((i) => ({
              variantId: i.variantId, productName: i.variant.product.name, variantName: i.variant.name, sku: i.variant.sku,
              options: i.variant.options ?? undefined, imageUrl: i.variant.image?.url ?? i.variant.product.images[0]?.url ?? null,
              unitCents: i.variant.priceCents, quantity: i.quantity, totalCents: i.variant.priceCents * i.quantity,
            })),
          },
          payment: { create: { provider: "STRIPE", amountCents: totalCents, currency } },
          history: { create: { status: "PENDING_PAYMENT", actor: "system", note: "Order created" } },
        },
      });
      for (const i of items) {
        await reserveStock(tx, i.variantId, i.quantity);
        await tx.stockReservation.create({ data: { orderId: order.id, variantId: i.variantId, quantity: i.quantity, expiresAt } });
      }
      return order.id;
    }, { isolationLevel: "ReadCommitted", timeout: 15_000 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      const item = items.find((i) => i.variantId === err.variantId);
      return { error: `Not enough stock for ${item?.variant.product.name ?? "an item"} (${item?.variant.name ?? ""}). Please adjust your cart.` };
    }
    await logger.error("checkout.transaction_failed", err);
    return { error: "We couldn't start your order. Please try again." };
  }

  if (user && saveAddress) {
    const exists = await db.address.findFirst({ where: { userId: user.id, line1: address.line1, postalCode: address.postalCode || null, country: address.country } });
    if (!exists) await db.address.create({ data: { ...address, line2: address.line2 || null, region: address.region || null, postalCode: address.postalCode || null, phone: address.phone || null, userId: user.id } });
  }
  await db.cart.update({ where: { id: cart.id }, data: { email, lastActivityAt: new Date() } });

  let redirectUrl: string;
  try {
    const provider = getPaymentProvider("STRIPE");
    const result = await provider.createCheckout({
      orderId, cartId: cart.id, email, currency,
      lines: items.map((i) => ({ name: `${i.variant.product.name} — ${i.variant.name}`, imageUrl: i.variant.image?.url ?? i.variant.product.images[0]?.url, unitCents: i.variant.priceCents, quantity: i.quantity, taxCode: "txcd_99999999" })),
      shipping: { name: rate.name, cents: shippingCents, minDays: rate.minDays, maxDays: rate.maxDays },
      discountCents, discountLabel: discountCode, address, locale, expiresAt,
      automaticTax: payments.stripeTaxEnabled && process.env.STRIPE_TAX_ENABLED !== "false",
      successUrl: `${SITE}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE}/cart?cancelled=1`,
    });
    await db.payment.update({ where: { orderId }, data: { providerId: result.providerId } });
    redirectUrl = result.redirectUrl;
  } catch (err) {
    await logger.error("checkout.provider_failed", err, { orderId });
    try {
      await db.$transaction(async (tx) => {
        if ((await lockOrder(tx, orderId)) !== "PENDING_PAYMENT") return;
        await releaseOrderReservations(tx, orderId);
        await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", expiresAt: null, history: { create: { status: "CANCELLED", actor: "system", note: "Payment session creation failed" } } } });
        await tx.payment.update({ where: { orderId }, data: { status: "FAILED" } });
      });
    } catch (rollbackErr) {
      await logger.error("checkout.rollback_failed", rollbackErr, { orderId });
    }
    return { error: "Payment could not be started. Your cart is intact, please try again." };
  }

  redirect(redirectUrl);
}
