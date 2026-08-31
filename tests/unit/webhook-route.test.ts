import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { POST } from "@/app/api/webhooks/stripe/route";
import type { WebhookOutcome } from "@/lib/payments/types";

/** Le fournisseur est doublé : on teste la logique du webhook (idempotence, verrou, statuts), pas Stripe. */
let nextEvent: { eventId: string; type: string; outcome: WebhookOutcome };
let badSignature = false;
vi.mock("@/lib/payments", () => ({ getPaymentProvider: () => ({ parseWebhook: async () => { if (badSignature) throw new Error("bad signature"); return nextEvent; }, cancelCheckout: async () => {}, refund: async () => ({ refundId: "re_1" }) }) }));

const req = () => new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}", headers: { "stripe-signature": "sig" } });
const paid: WebhookOutcome = { kind: "paid", orderId: "o1", providerId: "cs_1", intentId: "pi_1", amountCents: 12345, currency: "USD", taxCents: 345 };

function mockTx(status: string | null) {
  const commits: string[] = [];
  const tx = {
    $queryRaw: vi.fn(async () => (status ? [{ status }] : [])),
    $executeRaw: vi.fn(async () => 1),
    order: { findUniqueOrThrow: vi.fn(async () => ({ id: "o1", currency: "USD", totalCents: 12000, userId: null, email: "a@b.c", discountCode: null, items: [{ variantId: "v1", quantity: 1 }] })), update: vi.fn(async () => ({ id: "o1", number: 1, email: "a@b.c", currency: "USD", totalCents: 12345, items: [] })) },
    stockReservation: { findMany: vi.fn(async () => [{ id: "r1", variantId: "v1", quantity: 1 }]), updateMany: vi.fn(async () => { commits.push("r1"); return { count: 1 }; }) },
    payment: { update: vi.fn(async () => ({})), updateMany: vi.fn(async () => ({ count: 1 })) },
    product: { updateMany: vi.fn(async () => ({ count: 1 })) },
    discount: { updateMany: vi.fn(async () => ({ count: 0 })) },
    cart: { findFirst: vi.fn(async () => null), update: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
  };
  vi.mocked(db.$transaction).mockImplementation(async (fn: unknown) => (fn as (t: unknown) => Promise<unknown>)(tx));
  return { tx, commits };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.webhookEvent.create).mockResolvedValue({ id: "evt", provider: "STRIPE", type: "t", processedAt: new Date() });
  vi.mocked(db.webhookEvent.delete).mockResolvedValue({ id: "evt", provider: "STRIPE", type: "t", processedAt: new Date() });
});

describe("stripe webhook route", () => {
  it("rejects invalid signatures with 400 before touching the database", async () => {
    badSignature = true;
    const res = await POST(req());
    badSignature = false;
    expect(res.status).toBe(400);
    expect(db.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("marks a pending order paid exactly once and commits stock", async () => {
    nextEvent = { eventId: "evt_1", type: "checkout.session.completed", outcome: paid };
    const { tx, commits } = mockTx("PENDING_PAYMENT");
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(commits).toEqual(["r1"]);
    expect(tx.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID", totalCents: 12345, taxCents: 345 }) }));
  });

  it("ignores a replayed event id (idempotence) without touching the database", async () => {
    nextEvent = { eventId: "evt_dup", type: "checkout.session.completed", outcome: paid };
    vi.mocked(db.webhookEvent.create).mockRejectedValueOnce(new Error("unique violation"));
    const { commits } = mockTx("PENDING_PAYMENT");
    const res = await POST(req());
    expect(await res.json()).toMatchObject({ duplicate: true });
    expect(commits).toEqual([]);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not debit stock twice when 'completed' and 'async_payment_succeeded' both arrive", async () => {
    nextEvent = { eventId: "evt_a", type: "checkout.session.completed", outcome: paid };
    const first = mockTx("PENDING_PAYMENT");
    await POST(req());
    expect(first.commits.length).toBe(1);
    nextEvent = { eventId: "evt_b", type: "checkout.session.async_payment_succeeded", outcome: paid };
    const second = mockTx("PAID"); // statut relu sous verrou
    await POST(req());
    expect(second.commits.length).toBe(0);
    expect(second.tx.order.update).not.toHaveBeenCalled();
  });

  it("a paid event for an order already cancelled by expiry flags it for refund instead of debiting stock", async () => {
    nextEvent = { eventId: "evt_late", type: "checkout.session.completed", outcome: paid };
    const { commits } = mockTx("CANCELLED");
    vi.mocked(db.payment.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(db.order.update).mockResolvedValue({} as never);
    await POST(req());
    expect(commits).toEqual([]);
    expect(db.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ internalNotes: expect.stringContaining("refund") }) }));
  });

  it("an expired event after payment does not release committed stock", async () => {
    nextEvent = { eventId: "evt_exp", type: "checkout.session.expired", outcome: { kind: "expired", orderId: "o1" } };
    const { tx } = mockTx("PAID");
    await POST(req());
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("refuses a currency mismatch and lets Stripe retry", async () => {
    nextEvent = { eventId: "evt_cur", type: "checkout.session.completed", outcome: { ...paid, currency: "MXN" } };
    mockTx("PENDING_PAYMENT");
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(db.webhookEvent.delete).toHaveBeenCalled();
  });
});
