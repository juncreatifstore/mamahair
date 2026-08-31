import { describe, it, expect } from "vitest";
import { validateDiscountRules, computeDiscountCents, eligibleSubtotal, type DiscountLike } from "@/lib/discount";

const base: DiscountLike = { id: "1", code: "TEST", type: "PERCENT", value: 10, currency: null, minOrderCents: null, maxUses: null, usesPerCustomer: null, usedCount: 0, startsAt: null, endsAt: null, isActive: true };
const ctx = { cartCurrency: "USD", subtotalCents: 10000, eligibleCents: 10000 };

describe("discount rules", () => {
  it("accepts a valid percent code", () => { expect(validateDiscountRules(base, ctx).ok).toBe(true); });
  it("rejects inactive, expired, not-yet-started and exhausted codes", () => {
    expect(validateDiscountRules({ ...base, isActive: false }, ctx).ok).toBe(false);
    expect(validateDiscountRules({ ...base, endsAt: new Date(Date.now() - 1000) }, ctx).ok).toBe(false);
    expect(validateDiscountRules({ ...base, startsAt: new Date(Date.now() + 1000) }, ctx).ok).toBe(false);
    expect(validateDiscountRules({ ...base, maxUses: 5, usedCount: 5 }, ctx).ok).toBe(false);
  });
  it("requires a currency for fixed amounts and never applies USD to MXN", () => {
    const fixed: DiscountLike = { ...base, type: "FIXED", value: 1000, currency: "USD" };
    expect(validateDiscountRules({ ...fixed, currency: null }, ctx).ok).toBe(false);
    expect(validateDiscountRules(fixed, ctx).ok).toBe(true);
    expect(validateDiscountRules(fixed, { ...ctx, cartCurrency: "MXN" }).ok).toBe(false);
  });
  it("requires a currency for minimum order and enforces it", () => {
    expect(validateDiscountRules({ ...base, minOrderCents: 5000 }, ctx).ok).toBe(false);
    expect(validateDiscountRules({ ...base, minOrderCents: 5000, currency: "USD" }, ctx).ok).toBe(true);
    expect(validateDiscountRules({ ...base, minOrderCents: 20000, currency: "USD" }, ctx).ok).toBe(false);
  });
  it("enforces uses per customer", () => {
    expect(validateDiscountRules({ ...base, usesPerCustomer: 1 }, { ...ctx, customerUses: 1 }).ok).toBe(false);
    expect(validateDiscountRules({ ...base, usesPerCustomer: 1 }, { ...ctx, customerUses: 0 }).ok).toBe(true);
  });
  it("rejects when no eligible items", () => { expect(validateDiscountRules(base, { ...ctx, eligibleCents: 0 }).ok).toBe(false); });
});

describe("discount amounts", () => {
  it("computes percent and fixed, capped to the eligible subtotal", () => {
    expect(computeDiscountCents({ type: "PERCENT", value: 10 }, 10000)).toBe(1000);
    expect(computeDiscountCents({ type: "PERCENT", value: 150 }, 10000)).toBe(10000);
    expect(computeDiscountCents({ type: "FIXED", value: 2000 }, 1500)).toBe(1500);
    expect(computeDiscountCents({ type: "FREE_SHIPPING", value: 0 }, 1500)).toBe(0);
  });
  it("restricts to categories / products", () => {
    const lines = [{ variantId: "v1", productId: "p1", categoryId: "c1", lineCents: 5000 }, { variantId: "v2", productId: "p2", categoryId: "c2", lineCents: 3000 }];
    expect(eligibleSubtotal(lines, { productIds: [], categoryIds: [] })).toBe(8000);
    expect(eligibleSubtotal(lines, { productIds: [], categoryIds: ["c1"] })).toBe(5000);
    expect(eligibleSubtotal(lines, { productIds: ["p2"], categoryIds: [] })).toBe(3000);
  });
});
