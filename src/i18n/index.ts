import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import ht from "../../messages/ht.json";

export type Dict = typeof en;
export const LOCALES = ["en", "es", "fr", "ht"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español", fr: "Français", ht: "Kreyòl" };
export const LOCALE_COOKIE = "locale";
export const CURRENCY_COOKIE = "currency";
export const DEFAULT_LOCALE: Locale = (process.env.DEFAULT_LOCALE as Locale) ?? "en";

const dictionaries: Record<Locale, Dict> = { en, es: es as Dict, fr: fr as Dict, ht: ht as Dict };

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export function getDict(locale: string = DEFAULT_LOCALE): Dict {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

/** Interpolation simple : t("shop.results", { n: 12 }) */
export function fmt(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
