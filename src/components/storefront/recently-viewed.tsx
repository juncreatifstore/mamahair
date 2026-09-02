"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ViewedProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
};

const STORAGE_KEY = "mamahair:recently-viewed:v1";
const MAX_STORED = 10;

function readHistory(): ViewedProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ViewedProduct => Boolean(item && typeof item.id === "string" && typeof item.slug === "string" && typeof item.name === "string" && typeof item.priceCents === "number" && typeof item.currency === "string"));
  } catch {
    return [];
  }
}

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function RecentlyViewed({ current, title, eyebrow }: { current: ViewedProduct; title: string; eyebrow: string }) {
  const [history, setHistory] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const previous = readHistory().filter((item) => item.id !== current.id);
    setHistory(previous.slice(0, 4));

    const next = [current, ...previous].slice(0, MAX_STORED);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Browsing history is optional; storefront remains fully functional if storage is unavailable.
    }
  }, [current.id, current.slug, current.name, current.imageUrl, current.priceCents, current.currency]);

  if (history.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 md:mt-20" aria-label={title}>
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-flame">{eyebrow}</p>
        <h2 className="mt-2 text-4xl text-cocoa">{title}</h2>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {history.map((item) => (
          <Link key={item.id} href={`/products/${item.slug}`} className="group w-[72vw] max-w-[270px] shrink-0 sm:w-auto sm:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-petal ring-1 ring-sand/70">
              {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-xs font-semibold uppercase tracking-[.12em] text-cocoa/50">MAMAHAIR</div>}
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-cocoa">{item.name}</p>
            <p className="mt-1 text-sm text-ink-soft">{formatPrice(item.priceCents, item.currency)}</p>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-ink-soft">Stored only in this browser.</p>
    </section>
  );
}
