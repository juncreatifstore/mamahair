"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LocaleCurrencySwitcher } from "./locale-switcher";

export function MobileMenu({
  nav,
  label,
  locale,
  currency,
  locales,
  currencies,
  labels,
}: {
  nav: { href: string; label: string }[];
  label: string;
  locale: string;
  currency: string;
  locales: string[];
  currencies: string[];
  labels: { language: string; currency: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button aria-label={label} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-pill hover:bg-petal"><Menu className="size-5" /></button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <nav className="h-full w-[88vw] max-w-sm overflow-y-auto bg-cream p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <span className="display text-2xl text-cocoa">{label}</span>
              <button aria-label="Close" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-petal"><X className="size-5" /></button>
            </div>

            <div className="mt-5 rounded-2xl border border-sand bg-white p-4 shadow-sm">
              <LocaleCurrencySwitcher
                mobile
                locale={locale}
                currency={currency}
                locales={locales}
                currencies={currencies}
                labels={labels}
              />
            </div>

            <ul className="mt-5 space-y-1">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-cocoa hover:bg-petal">{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
