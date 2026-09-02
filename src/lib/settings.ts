import { cache } from "react";
import { db } from "./db";

/**
 * Centre de configuration MAMAHAIR (Admin → Settings).
 * Chaque section est une clé `Setting` JSON avec des valeurs par défaut typées.
 */
export type SettingsMap = {
  general: { companyName: string; storeName: string; tagline: string; announcement: string; announcementEnabled: boolean };
  branding: { logoUrl: string; logoLightUrl: string; logoDarkUrl: string; faviconUrl: string; primaryColor: string; accentColor: string };
  contact: { email: string; phone: string; whatsapp: string; addressLine: string; city: string; region: string; postalCode: string; country: string };
  social: { instagram: string; facebook: string; tiktok: string; youtube: string; pinterest: string };
  commerce: { defaultCurrency: string; enabledCurrencies: string[]; enabledCountries: string[]; lowStockThreshold: number; reservationMinutes: number; freeShippingBannerCents: number; allowGuestCheckout: boolean };
  payments: { stripeEnabled: boolean; stripeTaxEnabled: boolean; applePayGooglePay: boolean; mercadoPagoEnabled: boolean; paypalEnabled: boolean };
  rewards: { enabled: boolean; paidOrderPoints: number; perItemPoints: number; minRedeemPoints: number; pointsPerPercent: number; maxRedeemPercent: number; flameThreshold: number; crownThreshold: number };
  shipping: { originCountry: string; handlingDays: number; carrierIntegration: "none" | "shippo" | "easypost" };
  email: { fromName: string; fromEmail: string; replyTo: string; footerText: string };
  seo: { defaultTitle: string; defaultDescription: string; ogImageUrl: string; twitterHandle: string };
  localization: { defaultLocale: string; enabledLocales: string[]; defaultCountry: string };
  policies: { shipping: string; returns: string; privacy: string; terms: string };
};
export type SettingSection = keyof SettingsMap;

export const DEFAULT_SETTINGS: SettingsMap = {
  general: { companyName: "MAMAHAIR.COM", storeName: "MAMAHAIR", tagline: "Premium wigs, bundles & hair care for textured hair", announcement: "Free US shipping over $99 · New arrivals every week · Secure checkout", announcementEnabled: true },
  branding: { logoUrl: "", logoLightUrl: "", logoDarkUrl: "", faviconUrl: "", primaryColor: "#4A1B0C", accentColor: "#D85A30" },
  contact: { email: "hello@mamahair.com", phone: "", whatsapp: "", addressLine: "", city: "", region: "", postalCode: "", country: "US" },
  social: { instagram: "", facebook: "", tiktok: "", youtube: "", pinterest: "" },
  commerce: { defaultCurrency: "USD", enabledCurrencies: ["USD"], enabledCountries: ["US"], lowStockThreshold: 5, reservationMinutes: 30, freeShippingBannerCents: 9900, allowGuestCheckout: true },
  payments: { stripeEnabled: true, stripeTaxEnabled: true, applePayGooglePay: true, mercadoPagoEnabled: false, paypalEnabled: false },
  rewards: { enabled: true, paidOrderPoints: 100, perItemPoints: 25, minRedeemPoints: 500, pointsPerPercent: 100, maxRedeemPercent: 20, flameThreshold: 1000, crownThreshold: 3000 },
  shipping: { originCountry: "US", handlingDays: 2, carrierIntegration: "none" },
  email: { fromName: "MAMAHAIR", fromEmail: "orders@mamahair.com", replyTo: "hello@mamahair.com", footerText: "Premium hair, shipped with love." },
  seo: { defaultTitle: "MAMAHAIR — Premium wigs, bundles & hair care", defaultDescription: "Human hair wigs, bundles, closures, frontals and care products for afro, curly and textured hair. Ships from the USA.", ogImageUrl: "", twitterHandle: "" },
  localization: { defaultLocale: "en", enabledLocales: ["en", "es", "fr", "ht"], defaultCountry: "US" },
  policies: { shipping: "", returns: "", privacy: "", terms: "" },
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
  return db.setting.upsert({ where: { key }, update: { value: value as object }, create: { key, value: value as object } });
}

export const getSection = cache(async <K extends SettingSection>(section: K): Promise<SettingsMap[K]> => {
  const stored = await getSetting<Partial<SettingsMap[K]>>(`settings:${section}`, {});
  return { ...DEFAULT_SETTINGS[section], ...stored };
});

export async function saveSection<K extends SettingSection>(section: K, value: Partial<SettingsMap[K]>) {
  const current = await getSection(section);
  return setSetting(`settings:${section}`, { ...current, ...value });
}

export const getBrand = cache(async () => {
  const [general, branding, contact, social, commerce, seo, localization] = await Promise.all([
    getSection("general"), getSection("branding"), getSection("contact"), getSection("social"), getSection("commerce"), getSection("seo"), getSection("localization"),
  ]);
  return { ...general, branding, contact, social, commerce, seo, localization };
});

export const getEnabledCountries = async () => (await getSection("commerce")).enabledCountries;
export const getEnabledCurrencies = async () => (await getSection("commerce")).enabledCurrencies;

export const getStore = async () => {
  const b = await getBrand();
  return { name: b.storeName, tagline: b.tagline, email: b.contact.email, currency: b.commerce.defaultCurrency, locale: b.localization.defaultLocale };
};
