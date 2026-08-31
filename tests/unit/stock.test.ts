import { describe, it, expect, vi } from "vitest";
import { reserveStock, releaseStock, commitStock, restock, releaseOrderReservations, commitOrderReservations, expireStaleReservations, InsufficientStockError, StockInconsistencyError, available } from "@/lib/stock";

type Res = { id: string; orderId: string; variantId: string; quantity: number; releasedAt: Date | null; committedAt: Date | null };

/**
 * Inventaire simulé qui applique les mêmes conditions que les UPDATE SQL :
 * permet de vérifier la logique de concurrence sans base de données.
 */
function fakeInventoryTx(inv: Record<string, { quantity: number; reserved: number }>, reservations: Res[] = [], orderStatus: string | null = "PENDING_PAYMENT") {
  const sqlOf = (strings: TemplateStringsArray) => strings.join("?");
  const tx = {
    $executeRaw: vi.fn(async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const sql = sqlOf(strings);
      const qty = vals.find((v) => typeof v === "number") as number;
      const variantId = vals.find((v) => typeof v === "string") as string;
      const row = inv[variantId];
      if (!row) return 0;
      if (sql.includes('"reserved" + ')) { if (row.quantity - row.reserved >= qty) { row.reserved += qty; return 1; } return 0; }
      if (sql.includes('"quantity" - ') && sql.includes('"reserved" - ')) { if (row.quantity >= qty && row.reserved >= qty) { row.quantity -= qty; row.reserved -= qty; return 1; } return 0; }
      if (sql.includes('"reserved" - ')) { if (row.reserved >= qty) { row.reserved -= qty; return 1; } return 0; }
      if (sql.includes('"quantity" + ')) { row.quantity += qty; return 1; }
      return 0;
    }),
    $queryRaw: vi.fn(async () => (orderStatus ? [{ status: orderStatus }] : [])),
    stockReservation: {
      findMany: vi.fn(async ({ where }: { where: { orderId: string } }) => reservations.filter((r) => r.orderId === where.orderId && !r.releasedAt && !r.committedAt)),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Res> }) => { const r = reservations.find((x) => x.id === where.id && !x.releasedAt && !x.committedAt); if (!r) return { count: 0 }; Object.assign(r, data); return { count: 1 }; }),
    },
    order: { update: vi.fn(async () => ({})) },
    payment: { updateMany: vi.fn(async () => ({ count: 1 })) },
  };
  return tx as unknown as Parameters<typeof reserveStock>[0] & typeof tx;
}
const res = (id: string, orderId: string, variantId: string, quantity: number): Res => ({ id, orderId, variantId, quantity, releasedAt: null, committedAt: null });

describe("atomic reservation", () => {
  it("reserves only while quantity - reserved >= qty", async () => {
    const inv = { v1: { quantity: 3, reserved: 0 } };
    const tx = fakeInventoryTx(inv);
    await reserveStock(tx, "v1", 2);
    expect(inv.v1.reserved).toBe(2);
    await expect(reserveStock(tx, "v1", 2)).rejects.toBeInstanceOf(InsufficientStockError);
    expect(inv.v1.reserved).toBe(2);
  });
  it("two concurrent buyers cannot both take the last unit", async () => {
    const inv = { v1: { quantity: 1, reserved: 0 } };
    const tx = fakeInventoryTx(inv);
    const results = await Promise.allSettled([reserveStock(tx, "v1", 1), reserveStock(tx, "v1", 1)]);
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    expect(results.filter((r) => r.status === "rejected").length).toBe(1);
    expect(inv.v1.reserved).toBe(1);
  });
  it("rejects zero or negative quantities", async () => {
    const tx = fakeInventoryTx({ v1: { quantity: 5, reserved: 0 } });
    await expect(reserveStock(tx, "v1", 0)).rejects.toBeInstanceOf(InsufficientStockError);
    await expect(reserveStock(tx, "v1", -1)).rejects.toBeInstanceOf(InsufficientStockError);
  });
  it("uses a conditional SQL update, never read-then-write", async () => {
    const tx = fakeInventoryTx({ v1: { quantity: 5, reserved: 0 } });
    await reserveStock(tx, "v1", 1);
    const sql = (tx.$executeRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
    expect(sql).toMatch(/\("quantity" - "reserved"\) >= /);
  });
});

describe("release / commit / restock detect inconsistencies instead of masking them", () => {
  it("release fails explicitly when reserved would go negative", async () => {
    const inv = { v1: { quantity: 5, reserved: 1 } };
    const tx = fakeInventoryTx(inv);
    await releaseStock(tx, "v1", 1);
    expect(inv.v1.reserved).toBe(0);
    await expect(releaseStock(tx, "v1", 1)).rejects.toBeInstanceOf(StockInconsistencyError);
  });
  it("commit decrements both counters and refuses when quantity or reserved is too low", async () => {
    const inv = { v1: { quantity: 2, reserved: 2 } };
    const tx = fakeInventoryTx(inv);
    await commitStock(tx, "v1", 2);
    expect(inv.v1).toEqual({ quantity: 0, reserved: 0 });
    await expect(commitStock(tx, "v1", 1)).rejects.toBeInstanceOf(StockInconsistencyError);
    expect(inv.v1.quantity).toBe(0); // jamais négatif
  });
  it("restock increments quantity and fails for unknown variants", async () => {
    const inv = { v1: { quantity: 0, reserved: 0 } };
    const tx = fakeInventoryTx(inv);
    await restock(tx, "v1", 3);
    expect(inv.v1.quantity).toBe(3);
    await expect(restock(tx, "nope", 1)).rejects.toBeInstanceOf(StockInconsistencyError);
  });
});

describe("order reservations are idempotent", () => {
  it("releases each reservation once, even when called twice", async () => {
    const inv = { v1: { quantity: 5, reserved: 2 } };
    const rs = [res("r1", "o1", "v1", 2)];
    const tx = fakeInventoryTx(inv, rs);
    expect(await releaseOrderReservations(tx, "o1")).toBe(1);
    expect(await releaseOrderReservations(tx, "o1")).toBe(0);
    expect(inv.v1.reserved).toBe(2 - 2);
  });
  it("commits once; a second commit (replayed webhook) does not debit stock again", async () => {
    const inv = { v1: { quantity: 5, reserved: 2 } };
    const rs = [res("r1", "o1", "v1", 2)];
    const tx = fakeInventoryTx(inv, rs);
    expect(await commitOrderReservations(tx, "o1")).toBe(1);
    expect(await commitOrderReservations(tx, "o1")).toBe(0);
    expect(inv.v1).toEqual({ quantity: 3, reserved: 0 });
  });
  it("a reservation already committed cannot be released afterwards (paid then expiry)", async () => {
    const inv = { v1: { quantity: 5, reserved: 2 } };
    const rs = [res("r1", "o1", "v1", 2)];
    const tx = fakeInventoryTx(inv, rs);
    await commitOrderReservations(tx, "o1");
    expect(await releaseOrderReservations(tx, "o1")).toBe(0);
    expect(inv.v1).toEqual({ quantity: 3, reserved: 0 });
  });
});

describe("expiration cron", () => {
  function fakeClient(orders: { id: string }[], statusUnderLock: string, inv: Record<string, { quantity: number; reserved: number }>, rs: Res[]) {
    const tx = fakeInventoryTx(inv, rs, statusUnderLock);
    return { client: { order: { findMany: vi.fn(async () => orders) }, $transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => fn(tx)) } as never, tx };
  }
  it("cancels expired pending orders and releases their stock", async () => {
    const inv = { v1: { quantity: 5, reserved: 1 } };
    const { client, tx } = fakeClient([{ id: "o1" }], "PENDING_PAYMENT", inv, [res("r1", "o1", "v1", 1)]);
    const r = await expireStaleReservations(100, client);
    expect(r).toMatchObject({ expiredOrders: 1, releasedReservations: 1, failed: 0, expiredOrderIds: ["o1"] });
    expect(inv.v1.reserved).toBe(0);
    expect(tx.order.update).toHaveBeenCalledTimes(1);
  });
  it("does nothing when the order was paid meanwhile (status re-read under lock)", async () => {
    const inv = { v1: { quantity: 4, reserved: 0 } };
    const { client, tx } = fakeClient([{ id: "o1" }], "PAID", inv, []);
    const r = await expireStaleReservations(100, client);
    expect(r.expiredOrders).toBe(0);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(inv.v1).toEqual({ quantity: 4, reserved: 0 });
  });
  it("running twice never releases twice", async () => {
    const inv = { v1: { quantity: 5, reserved: 1 } };
    const rs = [res("r1", "o1", "v1", 1)];
    const { client } = fakeClient([{ id: "o1" }], "PENDING_PAYMENT", inv, rs);
    await expireStaleReservations(100, client);
    await expireStaleReservations(100, client);
    expect(inv.v1.reserved).toBe(0);
  });
  it("reports an inconsistency instead of corrupting other orders", async () => {
    const inv = { v1: { quantity: 5, reserved: 0 } }; // reserved déjà à 0 : libération impossible
    const { client } = fakeClient([{ id: "o1" }], "PENDING_PAYMENT", inv, [res("r1", "o1", "v1", 1)]);
    const r = await expireStaleReservations(100, client);
    expect(r.failed).toBe(1);
    expect(r.expiredOrders).toBe(0);
  });
});

describe("available", () => {
  it("computes available stock", () => { expect(available({ quantity: 5, reserved: 2 })).toBe(3); expect(available({ quantity: 1, reserved: 3 })).toBe(0); expect(available(null)).toBe(0); });
});
