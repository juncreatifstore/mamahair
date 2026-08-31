import { Prisma } from "@prisma/client";
import { db } from "./db";
import { logger } from "./logger";

/**
 * Stock atomique.
 * Invariants (garantis en base par des CHECK) : quantity >= 0, reserved >= 0, reserved <= quantity.
 * Toutes les écritures sont des UPDATE conditionnels : si la condition n'est pas remplie, 0 ligne est
 * touchée et une erreur explicite est levée (jamais de GREATEST() qui masquerait une incohérence).
 */
export class InsufficientStockError extends Error {
  constructor(public variantId: string, public requested: number) {
    super("Insufficient stock");
    this.name = "InsufficientStockError";
  }
}

export class StockInconsistencyError extends Error {
  constructor(public operation: "release" | "commit" | "restock", public variantId: string, public quantity: number) {
    super(`Stock inconsistency on ${operation} for variant ${variantId} (qty ${quantity})`);
    this.name = "StockInconsistencyError";
  }
}

type Tx = Prisma.TransactionClient;

/** Verrouille la ligne de commande (SELECT … FOR UPDATE) pour sérialiser webhook / cron / admin. */
export async function lockOrder(tx: Tx, orderId: string) {
  const rows = await tx.$queryRaw<{ status: string }[]>`SELECT "status" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
  return rows[0]?.status ?? null;
}

/** Réserve atomiquement : n'écrit que si (quantity - reserved) >= qty. Deux clients ne peuvent pas prendre le dernier article. */
export async function reserveStock(tx: Tx, variantId: string, qty: number) {
  if (!Number.isInteger(qty) || qty <= 0) throw new InsufficientStockError(variantId, qty);
  const updated = await tx.$executeRaw`
    UPDATE "Inventory" SET "reserved" = "reserved" + ${qty}, "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND ("quantity" - "reserved") >= ${qty}`;
  if (updated !== 1) throw new InsufficientStockError(variantId, qty);
}

/** Libère une réservation. Exige reserved >= qty, sinon incohérence explicite. */
export async function releaseStock(tx: Tx, variantId: string, qty: number) {
  const updated = await tx.$executeRaw`
    UPDATE "Inventory" SET "reserved" = "reserved" - ${qty}, "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND "reserved" >= ${qty}`;
  if (updated !== 1) throw new StockInconsistencyError("release", variantId, qty);
}

/** Paiement confirmé : la réservation devient une sortie de stock réelle. Exige quantity >= qty et reserved >= qty. */
export async function commitStock(tx: Tx, variantId: string, qty: number) {
  const updated = await tx.$executeRaw`
    UPDATE "Inventory" SET "quantity" = "quantity" - ${qty}, "reserved" = "reserved" - ${qty}, "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND "quantity" >= ${qty} AND "reserved" >= ${qty}`;
  if (updated !== 1) throw new StockInconsistencyError("commit", variantId, qty);
}

/** Remboursement total / annulation après paiement : remise en stock. */
export async function restock(tx: Tx, variantId: string, qty: number) {
  const updated = await tx.$executeRaw`UPDATE "Inventory" SET "quantity" = "quantity" + ${qty}, "updatedAt" = NOW() WHERE "variantId" = ${variantId}`;
  if (updated !== 1) throw new StockInconsistencyError("restock", variantId, qty);
}

/**
 * Libère toutes les réservations actives d'une commande. Idempotent : chaque réservation est marquée
 * `releasedAt` par un UPDATE conditionnel ; une deuxième exécution ne touche rien.
 * À appeler sous verrou de commande (lockOrder) depuis le webhook, le cron ou l'admin.
 */
export async function releaseOrderReservations(tx: Tx, orderId: string) {
  const active = await tx.stockReservation.findMany({ where: { orderId, releasedAt: null, committedAt: null } });
  let n = 0;
  for (const r of active) {
    const marked = await tx.stockReservation.updateMany({ where: { id: r.id, releasedAt: null, committedAt: null }, data: { releasedAt: new Date() } });
    if (marked.count !== 1) continue; // déjà traité par un autre processus
    await releaseStock(tx, r.variantId, r.quantity);
    n++;
  }
  return n;
}

/** Convertit les réservations d'une commande en sorties de stock. Même protection idempotente. */
export async function commitOrderReservations(tx: Tx, orderId: string) {
  const active = await tx.stockReservation.findMany({ where: { orderId, releasedAt: null, committedAt: null } });
  let n = 0;
  for (const r of active) {
    const marked = await tx.stockReservation.updateMany({ where: { id: r.id, releasedAt: null, committedAt: null }, data: { committedAt: new Date() } });
    if (marked.count !== 1) continue;
    await commitStock(tx, r.variantId, r.quantity);
    n++;
  }
  return n;
}

type Client = Pick<typeof db, "order" | "$transaction">;

/**
 * Expire les commandes PENDING_PAYMENT dépassées et libère leur stock.
 * - Le statut est relu SOUS VERROU : si le webhook "paid" est passé entre-temps, on ne touche à rien.
 * - Chaque commande est traitée dans sa propre transaction : une incohérence n'empêche pas les autres.
 * - Ré-exécutable sans double libération (réservations marquées releasedAt).
 * Retourne les ids expirés pour que l'appelant ferme aussi la session de paiement.
 */
export async function expireStaleReservations(limit = 100, client: Client = db) {
  const stale = await client.order.findMany({ where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } }, select: { id: true }, take: limit });
  const expiredOrderIds: string[] = [];
  let released = 0, failed = 0;
  for (const o of stale) {
    try {
      const done = await client.$transaction(async (tx) => {
        const status = await lockOrder(tx, o.id);
        if (status !== "PENDING_PAYMENT") return false;
        released += await releaseOrderReservations(tx, o.id);
        await tx.order.update({ where: { id: o.id }, data: { status: "CANCELLED", expiresAt: null, history: { create: { status: "CANCELLED", actor: "system", note: "Reservation expired" } } } });
        await tx.payment.updateMany({ where: { orderId: o.id, status: "PENDING" }, data: { status: "FAILED" } });
        return true;
      });
      if (done) expiredOrderIds.push(o.id);
    } catch (err) {
      failed++;
      await logger.error("stock.expire_failed", err, { orderId: o.id });
    }
  }
  return { expiredOrders: expiredOrderIds.length, releasedReservations: released, failed, expiredOrderIds };
}

export const available = (inv: { quantity: number; reserved: number } | null | undefined) => Math.max(0, (inv?.quantity ?? 0) - (inv?.reserved ?? 0));
