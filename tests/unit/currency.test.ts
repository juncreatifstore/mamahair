import { describe, it, expect } from "vitest";
import { validateDiscountRules, type DiscountLike } from "@/lib/discount";
import { computeShippingCents } from "@/lib/shipping";
import { assertSameCurrency } from "@/lib/money";

const fixedUsd: DiscountLike = { id: "d", code: "MAMA20", type: "FIXED", value: 2000, currency: "USD", minOrderCents: 15000, maxUses: null, usesPerCustomer: null, usedCount: 0, startsAt: null, endsAt: null, isActive: true };

describe("currencies are never mixed", () => {
  it("a fixed USD discount is refused on an MXN, CAD, DOP or HTG cart", () => {
    for (const c of ["MXN", "CAD", "DOP", "HTG"]) {
      const r = validateDiscountRules(fixedUsd, { cartCurrency: c, subtotalCents: 999999, eligibleCents: 999999 });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("USD");
    }
    expect(validateDiscountRules(fixedUsd, { cartCurrency: "USD", subtotalCents: 20000, eligibleCents: 20000 }).ok).toBe(true);
  });
  it("a percent discount without currency applies to any cart currency", () => {
    const pct: DiscountLike = { ...fixedUsd, type: "PERCENT", value: 10, currency: null, minOrderCents: null };
    for (const c of ["USD", "MXN", "CAD", "DOP", "HTG"]) expect(validateDiscountRules(pct, { cartCurrency: c, subtotalCents: 1000, eligibleCents: 1000 }).ok).toBe(true);
  });
  it("a shipping rate in another currency is refused", () => {
    const rateMxn = { priceCents: 45000, currency: "MXN", freeAboveCents: null, minWeightGrams: null, maxWeightGrams: null };
    expect(() => computeShippingCents(rateMxn, 1000, "USD")).toThrow(/currency/i);
    expect(computeShippingCents(rateMxn, 1000, "mxn")).toBe(45000);
  });
  it("assertSameCurrency guards arithmetic", () => { expect(() => assertSameCurrency("DOP", "HTG", "total")).toThrow(/total/); });
});
