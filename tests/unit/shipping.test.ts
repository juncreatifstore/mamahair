import { describe, it, expect } from "vitest";
import { computeShippingCents, rateMatchesWeight } from "@/lib/shipping";

const rate = { priceCents: 899, currency: "USD", freeAboveCents: 9900, minWeightGrams: null, maxWeightGrams: 2000 };

describe("shipping", () => {
  it("applies free shipping thresholds", () => {
    expect(computeShippingCents(rate, 5000, "USD")).toBe(899);
    expect(computeShippingCents(rate, 9900, "USD")).toBe(0);
  });
  it("refuses a rate in another currency", () => { expect(() => computeShippingCents(rate, 5000, "MXN")).toThrow(); });
  it("filters by weight", () => { expect(rateMatchesWeight(rate, 1500)).toBe(true); expect(rateMatchesWeight(rate, 2500)).toBe(false); });
});
