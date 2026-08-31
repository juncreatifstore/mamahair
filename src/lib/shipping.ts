import { db } from "./db";

export type RateLike = { priceCents: number; currency: string; freeAboveCents: number | null; minWeightGrams: number | null; maxWeightGrams: number | null };

/** Tarifs disponibles pour un pays, une devise et un poids de panier. Lus en base, jamais en dur. */
export async function getRatesForCountry(country: string, currency: string, weightGrams = 0) {
  const rates = await db.shippingRate.findMany({
    where: { isActive: true, currency: currency.toUpperCase(), zone: { isActive: true, countries: { has: country.toUpperCase() } } },
    orderBy: { priceCents: "asc" },
  });
  return rates.filter((r) => rateMatchesWeight(r, weightGrams));
}

export function rateMatchesWeight(r: { minWeightGrams: number | null; maxWeightGrams: number | null }, weightGrams: number) {
  if (r.minWeightGrams != null && weightGrams < r.minWeightGrams) return false;
  if (r.maxWeightGrams != null && weightGrams > r.maxWeightGrams) return false;
  return true;
}

/** Coût de livraison (pure, testable). Refuse un tarif dans une autre devise. */
export function computeShippingCents(rate: RateLike, subtotalCents: number, cartCurrency: string) {
  if (rate.currency.toUpperCase() !== cartCurrency.toUpperCase()) throw new Error(`Shipping rate currency ${rate.currency} does not match cart currency ${cartCurrency}`);
  if (rate.freeAboveCents != null && subtotalCents >= rate.freeAboveCents) return 0;
  return rate.priceCents;
}

export const cartWeightGrams = (items: { quantity: number; variant: { weightGrams: number | null; product: { weightGrams: number | null } } }[]) =>
  items.reduce((s, i) => s + i.quantity * (i.variant.weightGrams ?? i.variant.product.weightGrams ?? 0), 0);
