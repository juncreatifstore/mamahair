"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, CURRENCY_COOKIE } from "@/i18n";
import { isSupportedCurrency } from "@/lib/money";

const opts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, opts);
  revalidatePath("/", "layout");
}

export async function setCurrency(currency: string) {
  const c = currency.toUpperCase();
  if (!isSupportedCurrency(c)) return;
  (await cookies()).set(CURRENCY_COOKIE, c, opts);
  revalidatePath("/", "layout");
}
