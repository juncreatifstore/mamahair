import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function slugify(input: string) {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const HAIR_TYPE_LABELS: Record<string, string> = { T3A: "3A", T3B: "3B", T3C: "3C", T4A: "4A", T4B: "4B", T4C: "4C" };
export const CONCERN_LABELS: Record<string, string> = { hydration: "Hydration", definition: "Definition", growth: "Growth", scalp: "Scalp care", breakage: "Breakage", frizz: "Frizz", protective: "Protective styles", wigcare: "Wig care" };
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment", PAID: "Paid", PROCESSING: "Processing", READY_TO_SHIP: "Ready to ship", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled", REFUNDED: "Refunded", PARTIALLY_REFUNDED: "Partially refunded",
};

export function formatDate(d: Date | string, locale = "en-US") { return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(d)); }
export function formatDateTime(d: Date | string, locale = "en-US") { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)); }

export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "México", HT: "Haïti", DO: "República Dominicana", BR: "Brazil", CO: "Colombia", AR: "Argentina", CL: "Chile", PE: "Peru", JM: "Jamaica", TT: "Trinidad and Tobago", PR: "Puerto Rico",
  FR: "France", GB: "United Kingdom", DE: "Germany", ES: "Spain", IT: "Italy", BE: "Belgium", NL: "Netherlands", PT: "Portugal", CH: "Switzerland",
  SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun", NG: "Nigeria", GH: "Ghana", KE: "Kenya", ZA: "South Africa",
};
