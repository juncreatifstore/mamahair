import { describe, it, expect } from "vitest";
import { formatCents, toCents, fromCents, assertSameCurrency, percentOf, isSupportedCurrency } from "@/lib/money";

describe("money", () => {
  it("converts to and from cents without float drift", () => {
    expect(toCents("19.99")).toBe(1999);
    expect(toCents("0.1")).toBe(10);
    expect(toCents("1,50")).toBe(150);
    expect(fromCents(1999)).toBe("19.99");
  });
  it("formats per currency", () => {
    expect(formatCents(1999, "USD")).toBe("$19.99");
    expect(formatCents(45000, "MXN")).toContain("450");
    expect(formatCents(2699, "CAD")).toContain("26.99");
  });
  it("rounds percentages half-up", () => { expect(percentOf(1999, 10)).toBe(200); expect(percentOf(1000, 33)).toBe(330); });
  it("refuses to mix currencies", () => { expect(() => assertSameCurrency("USD", "MXN")).toThrow(); expect(() => assertSameCurrency("usd", "USD")).not.toThrow(); });
  it("knows supported currencies", () => { expect(isSupportedCurrency("HTG")).toBe(true); expect(isSupportedCurrency("XYZ")).toBe(false); });
});
