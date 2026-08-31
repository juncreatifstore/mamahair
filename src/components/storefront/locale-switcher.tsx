"use client";
import { useTransition } from "react";
import { setLocale, setCurrency } from "@/server/locale";
import { switchCartCurrency } from "@/server/cart";
import { LOCALE_NAMES } from "@/i18n";
import { CURRENCIES } from "@/lib/money";

export function LocaleCurrencySwitcher({
  locale,
  currency,
  locales,
  currencies,
  labels,
  mobile = false,
  mobileBar = false,
}: {
  locale: string;
  currency: string;
  locales: string[];
  currencies: string[];
  labels: { language: string; currency: string };
  mobile?: boolean;
  mobileBar?: boolean;
}) {
  const [pending, start] = useTransition();
  const desktopSelect = "h-9 rounded-pill border border-sand bg-white px-2 text-xs font-medium";
  const mobileSelect = "h-12 w-full rounded-xl border border-sand bg-white px-3 text-sm font-medium text-cocoa outline-none focus:border-cocoa";
  const barSelect = "h-9 min-w-0 flex-1 rounded-lg border border-sand bg-white px-2 text-xs font-semibold text-cocoa outline-none focus:border-cocoa";

  const languageSelect = (className: string) => (
    <select
      aria-label={labels.language}
      value={locale}
      onChange={(e) => start(() => setLocale(e.target.value))}
      className={className}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l as keyof typeof LOCALE_NAMES] ?? l.toUpperCase()}
        </option>
      ))}
    </select>
  );

  const currencySelect = (className: string) => currencies.length > 1 ? (
    <select
      aria-label={labels.currency}
      value={currency}
      onChange={(e) => start(async () => {
        await setCurrency(e.target.value);
        await switchCartCurrency(e.target.value);
      })}
      className={className}
    >
      {currencies.map((c) => (
        <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol ?? ""}</option>
      ))}
    </select>
  ) : (
    <div className={`${className} flex items-center`}>{currency} {CURRENCIES[currency]?.symbol ?? ""}</div>
  );

  if (mobileBar) {
    return (
      <div className={`flex w-full items-center gap-2 ${pending ? "opacity-60" : ""}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">{labels.language}</span>
          {languageSelect(barSelect)}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">{labels.currency}</span>
          {currencySelect(barSelect)}
        </div>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${pending ? "opacity-60" : ""}`}>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{labels.language}</span>
          {languageSelect(mobileSelect)}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{labels.currency}</span>
          {currencySelect(mobileSelect)}
        </label>
      </div>
    );
  }

  return (
    <div className={`hidden items-center gap-1 md:flex ${pending ? "opacity-60" : ""}`}>
      {languageSelect(desktopSelect)}
      {currencies.length > 1 && currencySelect(desktopSelect)}
    </div>
  );
}
