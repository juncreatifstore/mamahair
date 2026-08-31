"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = open && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <nav
        aria-label={label}
        className="h-[100dvh] w-[88vw] max-w-sm overflow-y-auto bg-cream p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand pb-4">
          <span className="display text-2xl text-cocoa">{label}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center rounded-full hover:bg-petal"
          >
            <X className="size-5" />
          </button>
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

        <ul className="mt-5 space-y-1 pb-8">
          {nav.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-base font-medium text-cocoa hover:bg-petal"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>,
    document.body
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-pill hover:bg-petal"
      >
        <Menu className="size-5" />
      </button>
      {drawer}
    </div>
  );
}
