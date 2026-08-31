/**
 * Règle : l'argent est TOUJOURS un entier en centimes + un code devise ISO 4217.
 * Les devises supportées et leur locale d'affichage par défaut.
 */
export const CURRENCIES: Record<string, { locale: string; symbol: string; name: string; zeroDecimal?: boolean }> = {
  USD: { locale: "en-US", symbol: "$", name: "US Dollar" },
  MXN: { locale: "es-MX", symbol: "MX$", name: "Peso mexicano" },
  CAD: { locale: "en-CA", symbol: "CA$", name: "Canadian Dollar" },
  DOP: { locale: "es-DO", symbol: "RD$", name: "Peso dominicano" },
  HTG: { locale: "fr-HT", symbol: "G", name: "Gourde" },
  EUR: { locale: "fr-FR", symbol: "€", name: "Euro" },
};

export const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? "USD";

export function isSupportedCurrency(c: string): boolean {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, c.toUpperCase());
}

export function formatCents(cents: number, currency: string = DEFAULT_CURRENCY, locale?: string) {
  const cur = currency.toUpperCase();
  const loc = locale ?? CURRENCIES[cur]?.locale ?? "en-US";
  return new Intl.NumberFormat(loc, { style: "currency", currency: cur }).format(cents / 100);
}

export function toCents(amount: string | number) {
  const n = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

export function fromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

/** Garantit qu'une opération n'additionne jamais deux devises différentes. */
export function assertSameCurrency(a: string, b: string, context = "amount") {
  if (a.toUpperCase() !== b.toUpperCase()) throw new Error(`Currency mismatch on ${context}: ${a} vs ${b}`);
}

export function percentOf(cents: number, percent: number) {
  return Math.round((cents * percent) / 100);
}
