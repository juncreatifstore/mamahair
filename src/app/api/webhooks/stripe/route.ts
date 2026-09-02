import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { commitOrderReservations, releaseOrderReservations, restock, lockOrder } from "@/lib/stock";
import { sendOrderConfirmation, sendRefund } from "@/lib/email";
import { awardPaidOrderRewards, restoreRewardRedemption } from "@/lib/rewards";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const provider = getPaymentProvider("STRIPE");
  let parsed: Awaited<ReturnType<typeof provider.parseWebhook>>;
  try { parsed = await provider.parseWebhook(await req.text(), req.headers); }
  catch (err) { logger.warn("webhook.invalid_signature", { message: (err as Error).message }); return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  const { eventId, type, outcome } = parsed;
  if (outcome.kind === "ignored") return NextResponse.json({ received: true, ignored: true });

  try { await db.webhookEvent.create({ data: { id: eventId, provider: "STRIPE", type } }); }
  catch { return NextResponse.json({ received: true, duplicate: true }); }

  try {
    if (outcome.kind === "paid") {
      const result = await db.$transaction(async (tx) => {
        const status = await lockOrder(tx, outcome.orderId);
        if (status === null) return { kind: "missing" as const };
        if (status !== "PENDING_PAYMENT") return { kind: "already" as const, status };
        const o = await tx.order.findUniqueOrThrow({ where: { id: outcome.orderId }, include: { items: true } });
        if (outcome.currency && outcome.currency !== o.currency.toUpperCase()) throw new Error(`Currency mismatch: Stripe ${outcome.currency} vs order ${o.currency}`);
        await commitOrderReservations(tx, o.id);
        const updated = await tx.order.update({ where: { id: o.id }, data: { status: "PAID", taxCents: outcome.taxCents, totalCents: outcome.amountCents || o.totalCents, paidAt: new Date(), expiresAt: null, history: { create: { status: "PAID", actor: "webhook", note: `Stripe ${type}` } } }, include: { items: true } });
        await tx.payment.update({ where: { orderId: o.id }, data: { status: "SUCCEEDED", providerId: outcome.providerId, intentId: outcome.intentId ?? undefined, amountCents: outcome.amountCents || o.totalCents, method: outcome.method ?? undefined, rawResponse: (outcome.raw ?? undefined) as object | undefined } });
        for (const i of o.items) await tx.product.updateMany({ where: { variants: { some: { id: i.variantId } } }, data: { salesCount: { increment: i.quantity } } });
        if (o.discountCode) await tx.discount.updateMany({ where: { code: o.discountCode }, data: { usedCount: { increment: 1 } } });
        const cart = await tx.cart.findFirst({ where: o.userId ? { userId: o.userId } : { email: o.email } });
        if (cart) { await tx.cartItem.deleteMany({ where: { cartId: cart.id } }); await tx.cart.update({ where: { id: cart.id }, data: { discountId: null, convertedAt: new Date() } }); }
        return { kind: "paid" as const, order: updated, userId: o.userId, itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0) };
      });
      if (result.kind === "paid") {
        if (result.userId) await awardPaidOrderRewards(result.order.id, result.userId, result.itemCount).catch((error) => logger.error("rewards.award_failed", error, { orderId: result.order.id }));
        await sendOrderConfirmation(result.order);
      } else if (result.kind === "already" && result.status === "CANCELLED") {
        await logger.error("webhook.paid_for_cancelled_order", new Error("Payment received for a cancelled order"), { orderId: outcome.orderId, providerId: outcome.providerId });
        await db.payment.updateMany({ where: { orderId: outcome.orderId }, data: { status: "SUCCEEDED", providerId: outcome.providerId, intentId: outcome.intentId ?? undefined, amountCents: outcome.amountCents } });
        await db.order.update({ where: { id: outcome.orderId }, data: { internalNotes: "PAYMENT RECEIVED AFTER CANCELLATION — refund required", history: { create: { status: "CANCELLED", actor: "webhook", note: "Payment received after cancellation: refund required" } } } });
      }
    }

    if (outcome.kind === "expired") {
      await db.$transaction(async (tx) => {
        if ((await lockOrder(tx, outcome.orderId)) !== "PENDING_PAYMENT") return;
        await releaseOrderReservations(tx, outcome.orderId);
        await tx.order.update({ where: { id: outcome.orderId }, data: { status: "CANCELLED", expiresAt: null, history: { create: { status: "CANCELLED", actor: "webhook", note: `Stripe ${type}` } } } });
        await tx.payment.updateMany({ where: { orderId: outcome.orderId, status: "PENDING" }, data: { status: "FAILED" } });
      });
      await restoreRewardRedemption(outcome.orderId).catch((error) => logger.error("rewards.restore_failed", error, { orderId: outcome.orderId }));
    }

    if (outcome.kind === "refunded") {
      const payment = await db.payment.findFirst({ where: { intentId: outcome.providerId }, include: { order: { include: { items: true } } } });
      if (payment && outcome.amountCents > payment.refundedCents) {
        const full = outcome.amountCents >= payment.amountCents;
        const delta = outcome.amountCents - payment.refundedCents;
        await db.$transaction(async (tx) => {
          const status = await lockOrder(tx, payment.orderId);
          await tx.payment.update({ where: { id: payment.id }, data: { refundedCents: outcome.amountCents, status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
          await tx.order.update({ where: { id: payment.orderId }, data: { refundedCents: outcome.amountCents, status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", history: { create: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", actor: "webhook", note: "Refund synced from Stripe" } } } });
          if (full && status !== "REFUNDED") for (const i of payment.order.items) await restock(tx, i.variantId, i.quantity);
        });
        if (full) await restoreRewardRedemption(payment.orderId).catch((error) => logger.error("rewards.refund_restore_failed", error, { orderId: payment.orderId }));
        await sendRefund({ ...payment.order, refundedCents: delta });
      }
    }
  } catch (err) {
    await logger.error("webhook.processing_failed", err, { eventId, type });
    await db.webhookEvent.delete({ where: { id: eventId } }).catch(() => null);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
