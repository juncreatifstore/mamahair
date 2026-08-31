"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/server/cart";
import { toggleWishlist } from "@/server/wishlist";
import { formatCents } from "@/lib/money";
import { OPTION_LABELS, type OptionKey } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  quantity: number;
  variant: {
    name: string;
    sku: string;
    priceCents: number;
    options: unknown;
    inventory: { quantity: number; reserved: number; lowStockAt: number } | null;
    image: { url: string } | null;
    product: { id: string; name: string; slug: string; images: { url: string }[] };
  };
};

export function CartLine({ item, currency, labels }: { item: Item; currency: string; labels: { remove: string; wishlist: string } }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const img = item.variant.image?.url ?? item.variant.product.images[0]?.url;
  const options = (item.variant.options ?? {}) as Record<string, string>;
  const optionEntries = Object.entries(options).filter(([, value]) => value);
  const available = Math.max(0, (item.variant.inventory?.quantity ?? 0) - (item.variant.inventory?.reserved ?? 0));
  const lowStockAt = item.variant.inventory?.lowStockAt ?? 5;
  const isLowStock = available > 0 && available <= lowStockAt;
  const unavailable = available === 0;

  const upd = (q: number) => start(async () => {
    const r = await updateCartItem(item.id, q);
    setErr(r?.error ?? null);
  });

  return (
    <article className={cn("grid grid-cols-[88px_1fr] gap-4 py-5 sm:grid-cols-[112px_1fr]", pending && "opacity-50")}>
      <Link href={`/products/${item.variant.product.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-petal">
        {img ? <Image src={img} alt={item.variant.product.name} fill sizes="112px" className="object-cover" /> : <div className="grid h-full place-items-center text-3xl text-cocoa/25">{item.variant.product.name.charAt(0)}</div>}
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${item.variant.product.slug}`} className="line-clamp-2 font-semibold hover:text-flame">{item.variant.product.name}</Link>
            <p className="mt-0.5 text-xs text-ink-soft">SKU {item.variant.sku}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-cocoa">{formatCents(item.variant.priceCents * item.quantity, currency)}</p>
            {item.quantity > 1 && <p className="text-xs text-ink-soft">{formatCents(item.variant.priceCents, currency)} each</p>}
          </div>
        </div>

        {optionEntries.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {optionEntries.map(([key, value]) => (
              <span key={key} className="rounded-pill bg-petal px-2.5 py-1 text-xs text-ink-soft">
                <span className="font-medium text-ink">{OPTION_LABELS[key as OptionKey] ?? key}</span>: {key === "length" ? `${value}\"` : value}
              </span>
            ))}
          </div>
        ) : item.variant.name !== "Default" ? <p className="mt-2 text-sm text-ink-soft">{item.variant.name}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {unavailable ? <span className="font-medium text-red-700">Out of stock</span> : isLowStock ? <span className="font-medium text-amber-700">Only {available} left</span> : <span className="text-green-700">{available} available</span>}
          {item.variant.inventory?.reserved ? <span className="text-ink-soft">{item.variant.inventory.reserved} reserved</span> : null}
        </div>

        {err && <p className="mt-2 text-xs text-red-700" role="alert">{err}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex h-10 items-center rounded-pill border border-sand bg-white">
            <button type="button" aria-label="Decrease quantity" disabled={pending} className="px-3 text-lg disabled:opacity-40" onClick={() => upd(item.quantity - 1)}>−</button>
            <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
            <button type="button" aria-label="Increase quantity" disabled={pending || unavailable || item.quantity >= available || item.quantity >= 20} className="px-3 text-lg disabled:cursor-not-allowed disabled:opacity-30" onClick={() => upd(item.quantity + 1)}>+</button>
          </div>

          <button type="button" disabled={pending} className="text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-40" onClick={() => start(() => removeCartItem(item.id))}>{labels.remove}</button>
          <button type="button" disabled={pending} className="text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-40" onClick={() => start(async () => { await toggleWishlist(item.variant.product.id); await removeCartItem(item.id); })}>{labels.wishlist}</button>
        </div>
      </div>
    </article>
  );
}
