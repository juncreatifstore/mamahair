"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import { releaseOrderReservations, restock, lockOrder } from "@/lib/stock";
import { sendOrderShipped, sendOrderProcessing, sendOrderDelivered, sendRefund } from "@/lib/email";
import { logger } from "@/lib/logger";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

export async function adminListOrders(opts: { status?: string; payment?: string; q?: string; from?: string; to?: string } = {}) {
  await requireAdmin();
  const where: Prisma.OrderWhereInput = opts.status ? { status: opts.status as OrderStatus } : { status: { not: "PENDING_PAYMENT" } };
  if (opts.payment) where.payment = { is: { status: opts.payment as PaymentStatus } };
  if (opts.q) {
    const n = parseInt(opts.q.replace("#", ""), 10);
    where.OR = [{ email: { contains: opts.q, mode: "insensitive" } }, ...(isNaN(n) ? [] : [{ number: n }]), { items: { some: { sku: { contains: opts.q, mode: "insensitive" } } } }, { user: { OR: [{ firstName: { contains: opts.q, mode: "insensitive" } }, { lastName: { contains: opts.q, mode: "insensitive" } }] } }];
  }
  if (opts.from || opts.to) where.createdAt = { ...(opts.from ? { gte: new Date(opts.from) } : {}), ...(opts.to ? { lte: new Date(opts.to + "T23:59:59") } : {}) };
  return db.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: true, shipment: true, user: { select: { firstName: true, lastName: true } }, payment: { select: { status: true, method: true } } }, take: 300 });
}

export async function adminGetOrder(id: string) {
  await requireAdmin();
  return db.order.findUnique({ where: { id }, include: { items: true, payment: true, shipment: true, shippingRate: true, user: true, history: { orderBy: { createdAt: "asc" } }, reservations: true } });
}

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"],
};

export async function updateOrderStatus(id: string, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) as OrderStatus;
  const current = await db.order.findUnique({ where: { id }, include: { items: true, payment: true } });
  if (!current) return { error: "Order not found." };
  if (!ALLOWED[current.status]?.includes(status)) return { error: `Cannot move from ${current.status} to ${status}.` };

  const note = String(formData.get("note") ?? "") || null;
  let order: Prisma.OrderGetPayload<{ include: { items: true } }>;
  try {
    order = await db.$transaction(async (tx) => {
      const locked = await lockOrder(tx, id);
      if (locked !== current.status) throw new Error(`Order changed to ${locked} meanwhile`);
      if (status === "CANCELLED") {
        if (current.status === "PENDING_PAYMENT") await releaseOrderReservations(tx, id);
        else for (const i of current.items) await restock(tx, i.variantId, i.quantity);
      }
      return tx.order.update({ where: { id }, data: { status, expiresAt: status === "CANCELLED" ? null : undefined, history: { create: { status, note, actor: admin.email } } }, include: { items: true } });
    });
  } catch (err) {
    await logger.error("order.status_update_failed", err, { orderId: id, status });
    return { error: "The order could not be updated. Refresh and try again." };
  }
  if (status === "CANCELLED" && current.status === "PENDING_PAYMENT" && current.payment?.providerId) {
    await getPaymentProvider(current.payment.provider).cancelCheckout(current.payment.providerId);
  }

  if (status === "SHIPPED") {
    const shipment = await db.shipment.upsert({
      where: { orderId: id },
      update: { carrier: String(formData.get("carrier") ?? "") || null, trackingNumber: String(formData.get("trackingNumber") ?? "") || null, trackingUrl: String(formData.get("trackingUrl") ?? "") || null, shippedAt: new Date() },
      create: { orderId: id, carrier: String(formData.get("carrier") ?? "") || null, trackingNumber: String(formData.get("trackingNumber") ?? "") || null, trackingUrl: String(formData.get("trackingUrl") ?? "") || null, shippedAt: new Date() },
    });
    await sendOrderShipped({ ...order, ...shipment });
  }
  if (status === "PROCESSING" && current.status === "PAID") await sendOrderProcessing(order);
  if (status === "DELIVERED") {
    await db.shipment.updateMany({ where: { orderId: id }, data: { deliveredAt: new Date() } });
    await sendOrderDelivered(order);
  }
  revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin/orders");
  return { ok: true };
}

export async function saveInternalNote(id: string, formData: FormData) {
  await requireAdmin();
  await db.order.update({ where: { id }, data: { internalNotes: String(formData.get("internalNotes") ?? "") } });
  revalidatePath(`/admin/orders/${id}`);
}

export async function refundOrder(id: string, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();
  const payment = await db.payment.findUnique({ where: { orderId: id }, include: { order: { include: { items: true } } } });
  if (!payment?.intentId || !["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(payment.status)) return { error: "This order has no refundable payment." };
  const raw = String(formData.get("amount") ?? "").trim();
  const remaining = payment.amountCents - payment.refundedCents;
  const amountCents = raw ? Math.round(parseFloat(raw) * 100) : remaining;
  if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > remaining) return { error: `Amount must be between 0.01 and ${(remaining / 100).toFixed(2)}.` };
  try {
    await getPaymentProvider(payment.provider).refund(payment.intentId, amountCents);
  } catch (err) {
    await logger.error("refund.failed", err, { orderId: id });
    return { error: "The payment provider rejected the refund." };
  }
  const total = payment.refundedCents + amountCents;
  const full = total >= payment.amountCents;
  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { orderId: id }, data: { refundedCents: total, status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    await tx.order.update({ where: { id }, data: { refundedCents: total, status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", history: { create: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", actor: admin.email, note: `Refund ${(amountCents / 100).toFixed(2)} ${payment.currency}` } } } });
    if (full) for (const i of payment.order.items) await restock(tx, i.variantId, i.quantity);
  });
  await sendRefund({ ...payment.order, refundedCents: amountCents });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}
