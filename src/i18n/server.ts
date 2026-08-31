import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getDict, isLocale, DEFAULT_LOCALE, LOCALE_COOKIE, CURRENCY_COOKIE, type Locale } from "./index";
import { getSection } from "@/lib/settings";
import { isSupportedCurrency } from "@/lib/money";

/** Locale courante : cookie → Accept-Language → défaut des Settings. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  const loc = await getSection("localization");
  if (isLocale(c) && loc.enabledLocales.includes(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code) && loc.enabledLocales.includes(code)) return code;
  }
  return isLocale(loc.defaultLocale) ? loc.defaultLocale : DEFAULT_LOCALE;
});

export const getT = cache(async () => getDict(await getLocale()));

/** Devise d'affichage : cookie si activée, sinon devise par défaut. */
export const getCurrency = cache(async (): Promise<string> => {
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value?.toUpperCase();
  const commerce = await getSection("commerce");
  if (c && isSupportedCurrency(c) && commerce.enabledCurrencies.includes(c)) return c;
  return commerce.defaultCurrency;
});
