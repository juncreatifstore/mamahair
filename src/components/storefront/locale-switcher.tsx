"use client";
import { useTransition } from "react";
import { setLocale, setCurrency } from "@/server/locale";
import { switchCartCurrency } from "@/server/cart";
import { LOCALE_NAMES } from "@/i18n";
import { CURRENCIES } from "@/lib/money";

export function LocaleCurrencySwitcher({ locale, currency, locales, currencies, labels }: { locale: string; currency: string; locales: string[]; currencies: string[]; labels: { language: string; currency: string } }) {
  const [pending, start] = useTransition();
  const sel = "h-9 rounded-pill border border-sand bg-white px-2 text-xs font-medium";
  return (
    <div className={`hidden items-center gap-1 md:flex ${pending ? "opacity-60" : ""}`}>
      <select aria-label={labels.language} value={locale} onChange={(e) => start(() => setLocale(e.target.value))} className={sel}>
        {locales.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l as keyof typeof LOCALE_NAMES] ?? l.toUpperCase()}</option>)}
      </select>
      {currencies.length > 1 && (
        <select aria-label={labels.currency} value={currency} onChange={(e) => start(async () => { await setCurrency(e.target.value); await switchCartCurrency(e.target.value); })} className={sel}>
          {currencies.map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol ?? ""}</option>)}
        </select>
      )}
    </div>
  );
}
