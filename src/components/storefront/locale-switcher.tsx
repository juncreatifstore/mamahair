"use client";
import { useTransition } from "react";
import { setLocale, setCurrency } from "@/server/locale";
import { switchCartCurrency } from "@/server/cart";
import { LOCALE_NAMES } from "@/i18n";
import { CURRENCIES } from "@/lib/money";

export function LocaleCurrencySwitcher({ locale, currency, locales, currencies, labels, mobile = false }: { locale: string; currency: string; locales: string[]; currencies: string[]; labels: { language: string; currency: string }; mobile?: boolean }) {
  const [pending, start] = useTransition();
  const desktopSelect = "h-9 rounded-pill border border-sand bg-white px-2 text-xs font-medium";
  const mobileSelect = "h-12 w-full rounded-xl border border-sand bg-white px-3 text-sm font-medium text-cocoa outline-none focus:border-cocoa";

  if (mobile) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${pending ? "opacity-60" : ""}`}>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{labels.language}</span>
          <select aria-label={labels.language} value={locale} onChange={(e) => start(() => setLocale(e.target.value))} className={mobileSelect}>
            {locales.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l as keyof typeof LOCALE_NAMES] ?? l.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{labels.currency}</span>
          {currencies.length > 1 ? (
            <select aria-label={labels.currency} value={currency} onChange={(e) => start(async () => { await setCurrency(e.target.value); await switchCartCurrency(e.target.value); })} className={mobileSelect}>
              {currencies.map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol ?? ""}</option>)}
            </select>
          ) : (
            <div className={`${mobileSelect} flex items-center`}>{currency} {CURRENCIES[currency]?.symbol ?? ""}</div>
          )}
        </label>
      </div>
    );
  }

  return (
    <div className={`hidden items-center gap-1 md:flex ${pending ? "opacity-60" : ""}`}>
      <select aria-label={labels.language} value={locale} onChange={(e) => start(() => setLocale(e.target.value))} className={desktopSelect}>
        {locales.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l as keyof typeof LOCALE_NAMES] ?? l.toUpperCase()}</option>)}
      </select>
      {currencies.length > 1 && (
        <select aria-label={labels.currency} value={currency} onChange={(e) => start(async () => { await setCurrency(e.target.value); await switchCartCurrency(e.target.value); })} className={desktopSelect}>
          {currencies.map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol ?? ""}</option>)}
        </select>
      )}
    </div>
  );
}
